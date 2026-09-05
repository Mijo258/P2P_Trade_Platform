from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from products.serializers import UserProfileSerializer
from rest_framework import generics
from django.contrib.auth.models import User
from .serializers import UserSerializer
from rest_framework.permissions import AllowAny

class UserCreate(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user.profile)
        return Response(serializer.data)
    
    def put(self, request):
        serializer = UserProfileSerializer(request.user.profile, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
