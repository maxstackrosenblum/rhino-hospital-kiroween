"""
Middleware package for the Hospital Management System.
"""

from .profanity import ProfanityFilterMiddleware

__all__ = ["ProfanityFilterMiddleware"]