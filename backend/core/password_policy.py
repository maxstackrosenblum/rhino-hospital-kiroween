"""
Password Policy Module
Implements HIPAA-compliant password requirements
"""
import re
from typing import List, Tuple

class PasswordPolicy:
    """
    HIPAA-compliant password policy:
    - Minimum 12 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    - At least one special character
    """
    
    MIN_LENGTH = 12
    REQUIRE_UPPERCASE = True
    REQUIRE_LOWERCASE = True
    REQUIRE_DIGIT = True
    REQUIRE_SPECIAL = True
    
    SPECIAL_CHARACTERS = "!@#$%^&*()_+-=[]{}|;:,.<>?"
    
    # Common passwords to reject
    COMMON_PASSWORDS = {
        "password123", "admin123456", "welcome12345", "hospital123",
        "qwerty123456", "abc123456789", "password1234", "letmein12345",
        "123456789012", "admin1234567", "password!@#", "Welcome123!",
    }

    @classmethod
    def validate(cls, password: str, username: str = None) -> Tuple[bool, List[str]]:
        """
        Validate password against policy
        
        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        errors = []
        
        # Check minimum length
        if len(password) < cls.MIN_LENGTH:
            errors.append(f"Password must be at least {cls.MIN_LENGTH} characters long")
        
        # Check for uppercase letter
        if cls.REQUIRE_UPPERCASE and not re.search(r'[A-Z]', password):
            errors.append("Password must contain at least one uppercase letter")
        
        # Check for lowercase letter
        if cls.REQUIRE_LOWERCASE and not re.search(r'[a-z]', password):
            errors.append("Password must contain at least one lowercase letter")
        
        # Check for digit
        if cls.REQUIRE_DIGIT and not re.search(r'\d', password):
            errors.append("Password must contain at least one number")
        
        # Check for special character
        if cls.REQUIRE_SPECIAL:
            if not any(char in cls.SPECIAL_CHARACTERS for char in password):
                errors.append(f"Password must contain at least one special character ({cls.SPECIAL_CHARACTERS})")
        
        return len(errors) == 0, errors
    
    @staticmethod
    def _has_sequential_chars(password: str, length: int = 3) -> bool:
        """Check for sequential characters like 'abc' or '123'"""
        password_lower = password.lower()
        for i in range(len(password_lower) - length + 1):
            substring = password_lower[i:i + length]
            # Check if characters are sequential
            if all(ord(substring[j]) == ord(substring[j-1]) + 1 for j in range(1, len(substring))):
                return True
        return False
    
    @staticmethod
    def _has_repeated_chars(password: str, max_repeat: int = 3) -> bool:
        """Check for repeated characters like 'aaaa'"""
        for i in range(len(password) - max_repeat):
            if len(set(password[i:i + max_repeat + 1])) == 1:
                return True
        return False
    
    @classmethod
    def get_strength(cls, password: str) -> Tuple[str, int]:
        """
        Calculate password strength
        
        Returns:
            Tuple of (strength_label, strength_score)
            strength_label: 'weak', 'fair', 'good', 'strong', 'very_strong'
            strength_score: 0-100
        """
        score = 0
        
        # Length score (up to 30 points)
        if len(password) >= cls.MIN_LENGTH:
            score += 15
        if len(password) >= 16:
            score += 10
        if len(password) >= 20:
            score += 5
        
        # Character variety (up to 40 points)
        if re.search(r'[a-z]', password):
            score += 10
        if re.search(r'[A-Z]', password):
            score += 10
        if re.search(r'\d', password):
            score += 10
        if any(char in cls.SPECIAL_CHARACTERS for char in password):
            score += 10
        
        # Complexity bonus (up to 30 points)
        unique_chars = len(set(password))
        if unique_chars >= 8:
            score += 10
        if unique_chars >= 12:
            score += 10
        if unique_chars >= 16:
            score += 10
        
        # Determine strength label
        if score < 40:
            label = 'weak'
        elif score < 60:
            label = 'fair'
        elif score < 75:
            label = 'good'
        elif score < 90:
            label = 'strong'
        else:
            label = 'very_strong'
        
        return label, score
    
    @classmethod
    def get_requirements_text(cls) -> List[str]:
        """Get list of password requirements as text"""
        requirements = [
            f"At least {cls.MIN_LENGTH} characters long",
        ]
        
        if cls.REQUIRE_UPPERCASE:
            requirements.append("At least one uppercase letter (A-Z)")
        
        if cls.REQUIRE_LOWERCASE:
            requirements.append("At least one lowercase letter (a-z)")
        
        if cls.REQUIRE_DIGIT:
            requirements.append("At least one number (0-9)")
        
        if cls.REQUIRE_SPECIAL:
            requirements.append(f"At least one special character ({cls.SPECIAL_CHARACTERS})")
        
        return requirements
