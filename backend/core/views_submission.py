import os
from datetime import datetime, timezone
from bson import ObjectId
from django.conf import settings
from django.http import FileResponse, Http404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, exceptions
from rest_framework.parsers import MultiPartParser, FormParser

from core.db import get_submissions_col, log_audit_event
from core.permissions import IsMongoAuthenticated
from core.file_validator import validate_uploaded_file
from core.deadline_policy import (
    get_countdown_info, 
    get_current_business_date, 
    get_deadline_config,
    get_deadline_datetime_for_date
)
from core.views_auth import get_client_ip

class TodayStatusView(APIView):
    """
    Returns today's submission status, live countdown timer data,
    and user submission summary statistics.
    """
    permission_classes = [IsMongoAuthenticated]

    def get(self, request):
        user_id = request.user.id
        now = datetime.now()
        current_date = get_current_business_date(now)
        countdown = get_countdown_info()

        submissions_col = get_submissions_col()

        # Check today's active submission
        today_sub = submissions_col.find_one({
            'user_id': user_id,
            'business_date': current_date,
            'is_active': True
        })

        # Single aggregation pipeline for user statistics (1 round-trip instead of 3)
        stats_pipe = [
            {'$match': {'user_id': user_id, 'is_active': True}},
            {'$group': {
                '_id': None,
                'total': {'$sum': 1},
                'on_time': {'$sum': {'$cond': [{'$eq': ['$status', 'ON_TIME']}, 1, 0]}},
                'late': {'$sum': {'$cond': [{'$eq': ['$status', 'LATE']}, 1, 0]}}
            }}
        ]
        agg_result = list(submissions_col.aggregate(stats_pipe))
        if agg_result:
            total_subs = agg_result[0].get('total', 0)
            on_time_subs = agg_result[0].get('on_time', 0)
            late_subs = agg_result[0].get('late', 0)
        else:
            total_subs = on_time_subs = late_subs = 0

        # Also fetch recent 5 submissions for instant dashboard render
        recent_docs = list(
            submissions_col.find({'user_id': user_id, 'is_active': True})
            .sort('business_date', -1)
            .limit(5)
        )
        recent_submissions = [
            {
                'id': str(d['_id']),
                'business_date': d.get('business_date'),
                'original_filename': d.get('original_filename'),
                'file_format': d.get('file_format'),
                'file_size': d.get('file_size'),
                'upload_timestamp': d.get('upload_timestamp'),
                'status': d.get('status'),
                'version': d.get('version', 1),
                'notes': d.get('notes', ''),
            }
            for d in recent_docs
        ]

        if today_sub:
            sub_status = 'SUBMITTED_ON_TIME' if today_sub.get('status') == 'ON_TIME' else 'SUBMITTED_LATE'
            today_data = {
                'id': str(today_sub['_id']),
                'business_date': today_sub.get('business_date'),
                'original_filename': today_sub.get('original_filename'),
                'file_format': today_sub.get('file_format'),
                'file_size': today_sub.get('file_size'),
                'upload_timestamp': today_sub.get('upload_timestamp'),
                'status': today_sub.get('status'),
                'version': today_sub.get('version', 1),
                'notes': today_sub.get('notes', ''),
                'can_replace': countdown['allow_replacement_before_deadline'] and not countdown['is_past_deadline']
            }
        else:
            sub_status = 'OVERDUE' if countdown['is_past_deadline'] else 'PENDING'
            today_data = None

        return Response({
            'today_submission_status': sub_status,
            'has_submitted_today': bool(today_sub),
            'today_submission': today_data,
            'recent_submissions': recent_submissions,
            'countdown': countdown,
            'summary': {
                'total_submissions': total_subs,
                'on_time_submissions': on_time_subs,
                'late_submissions': late_subs,
                'compliance_rate': round((on_time_subs / total_subs * 100), 1) if total_subs > 0 else 100.0
            }
        })

class UploadSubmissionView(APIView):
    """
    Handles upload and replacement of daily log sheets.
    """
    permission_classes = [IsMongoAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if 'file' not in request.FILES:
            return Response({'detail': 'No file was provided for upload.'}, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = request.FILES['file']
        notes = request.data.get('notes', '').strip()

        # 1. Validate file (size, extension, magic bytes)
        file_info = validate_uploaded_file(uploaded_file)

        now = datetime.now()
        current_date = get_current_business_date(now)
        deadline_str, allow_replacement = get_deadline_config()
        deadline_dt = get_deadline_datetime_for_date(current_date, deadline_str)

        is_on_time = now <= deadline_dt
        submission_status = 'ON_TIME' if is_on_time else 'LATE'

        submissions_col = get_submissions_col()
        user_id = request.user.id

        # Check existing active submission for today
        existing_sub = submissions_col.find_one({
            'user_id': user_id,
            'business_date': current_date,
            'is_active': True
        })

        if existing_sub:
            if not allow_replacement:
                return Response(
                    {'detail': 'You have already submitted a log sheet for today. File replacement is disabled by policy.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if now > deadline_dt:
                return Response(
                    {'detail': 'The deadline for today has passed. File replacement is not allowed past the submission deadline.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # 2. Save physical file to media storage directory
        media_subfolder = os.path.join(
            getattr(settings, 'MEDIA_ROOT', 'media'),
            'submissions',
            now.strftime('%Y'),
            now.strftime('%m')
        )
        os.makedirs(media_subfolder, exist_ok=True)
        absolute_file_path = os.path.join(media_subfolder, file_info['storage_filename'])

        with open(absolute_file_path, 'wb+') as destination:
            for chunk in uploaded_file.chunks():
                destination.write(chunk)

        iso_now = now.isoformat()

        if existing_sub:
            # Archive old version in history and update active record
            old_version_entry = {
                'version': existing_sub.get('version', 1),
                'storage_filename': existing_sub.get('storage_filename'),
                'original_filename': existing_sub.get('original_filename'),
                'file_format': existing_sub.get('file_format'),
                'file_size': existing_sub.get('file_size'),
                'upload_timestamp': existing_sub.get('upload_timestamp'),
                'status': existing_sub.get('status'),
                'replaced_at': iso_now
            }
            new_version = existing_sub.get('version', 1) + 1
            history = existing_sub.get('history', [])
            history.append(old_version_entry)

            submissions_col.update_one(
                {'_id': existing_sub['_id']},
                {
                    '$set': {
                        'storage_filename': file_info['storage_filename'],
                        'original_filename': file_info['original_filename'],
                        'file_format': file_info['file_format'],
                        'file_size': file_info['file_size'],
                        'file_path': absolute_file_path,
                        'upload_timestamp': iso_now,
                        'status': submission_status,
                        'version': new_version,
                        'notes': notes,
                        'history': history,
                        'updated_at': iso_now
                    }
                }
            )

            log_audit_event(
                user_id, request.user.email, 'FILE_REPLACED',
                {'submission_id': str(existing_sub['_id']), 'version': new_version, 'original_filename': file_info['original_filename']},
                get_client_ip(request)
            )

            return Response({
                'message': f'Log sheet replaced successfully (Version {new_version}).',
                'status': submission_status,
                'business_date': current_date,
                'version': new_version,
                'original_filename': file_info['original_filename']
            }, status=status.HTTP_200_OK)

        else:
            # Create new submission record
            new_record = {
                'user_id': user_id,
                'user_name': request.user.full_name,
                'user_email': request.user.email,
                'department': request.user.department,
                'employee_id': request.user.employee_id,
                'business_date': current_date,
                'storage_filename': file_info['storage_filename'],
                'original_filename': file_info['original_filename'],
                'file_format': file_info['file_format'],
                'file_size': file_info['file_size'],
                'file_path': absolute_file_path,
                'upload_timestamp': iso_now,
                'status': submission_status,
                'is_active': True,
                'version': 1,
                'notes': notes,
                'history': [],
                'created_at': iso_now
            }

            res = submissions_col.insert_one(new_record)
            log_audit_event(
                user_id, request.user.email, 'FILE_UPLOADED',
                {'submission_id': str(res.inserted_id), 'status': submission_status, 'original_filename': file_info['original_filename']},
                get_client_ip(request)
            )

            return Response({
                'message': 'Log sheet uploaded successfully.',
                'status': submission_status,
                'business_date': current_date,
                'version': 1,
                'original_filename': file_info['original_filename']
            }, status=status.HTTP_201_CREATED)

class UserSubmissionHistoryView(APIView):
    """
    Searchable, filterable history table of the user's own submissions.
    """
    permission_classes = [IsMongoAuthenticated]

    def get(self, request):
        user_id = request.user.id
        submissions_col = get_submissions_col()

        query = {'user_id': user_id, 'is_active': True}

        # Filter by status
        status_filter = request.GET.get('status')
        if status_filter and status_filter.upper() in ['ON_TIME', 'LATE']:
            query['status'] = status_filter.upper()

        # Filter by date range
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        if start_date or end_date:
            date_filter = {}
            if start_date:
                date_filter['$gte'] = start_date
            if end_date:
                date_filter['$lte'] = end_date
            query['business_date'] = date_filter

        # Search term across original_filename and notes
        search = request.GET.get('search', '').strip()
        if search:
            query['$or'] = [
                {'original_filename': {'$regex': search, '$options': 'i'}},
                {'notes': {'$regex': search, '$options': 'i'}}
            ]

        cursor = submissions_col.find(query).sort('business_date', -1)
        limit_val = request.GET.get('limit')
        if limit_val and limit_val.isdigit():
            cursor = cursor.limit(int(limit_val))

        results = []
        for doc in cursor:
            results.append({
                'id': str(doc['_id']),
                'business_date': doc.get('business_date'),
                'original_filename': doc.get('original_filename'),
                'file_format': doc.get('file_format'),
                'file_size': doc.get('file_size'),
                'upload_timestamp': doc.get('upload_timestamp'),
                'status': doc.get('status'),
                'version': doc.get('version', 1),
                'notes': doc.get('notes', ''),
                'history_count': len(doc.get('history', []))
            })

        return Response({
            'count': len(results),
            'results': results
        })

class DownloadSubmissionFileView(APIView):
    """
    Secure download endpoint with strict role and ownership verification.
    """
    permission_classes = [IsMongoAuthenticated]

    def get(self, request, submission_id):
        submissions_col = get_submissions_col()
        try:
            oid = ObjectId(submission_id)
            doc = submissions_col.find_one({'_id': oid})
        except Exception:
            doc = submissions_col.find_one({'_id': submission_id})

        if not doc:
            raise Http404("Submission not found.")

        # Permission check: normal user can only access their own submissions
        if request.user.role != 'admin' and doc.get('user_id') != request.user.id:
            return Response(
                {'detail': 'You do not have permission to access or download this file.'},
                status=status.HTTP_403_FORBIDDEN
            )

        file_path = doc.get('file_path')
        if not file_path or not os.path.exists(file_path):
            return Response(
                {'detail': 'The requested file was not found on the server storage.'},
                status=status.HTTP_404_NOT_FOUND
            )

        log_audit_event(
            request.user.id, request.user.email, 'FILE_DOWNLOADED',
            {'submission_id': str(doc['_id']), 'original_filename': doc.get('original_filename')},
            get_client_ip(request)
        )

        response = FileResponse(open(file_path, 'rb'), as_attachment=True, filename=doc.get('original_filename'))
        return response
