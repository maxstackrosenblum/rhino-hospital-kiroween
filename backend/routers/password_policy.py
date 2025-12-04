from fastapi import APIRouter
from core.password_policy import PasswordPolicy

router = APIRouter(prefix="/api", tags=["password-policy"])


@router.get("/password-policy")
async def get_password_policy():
    """
    Get password policy requirements
    """
    return {
        "min_length": PasswordPolicy.MIN_LENGTH,
        "require_uppercase": PasswordPolicy.REQUIRE_UPPERCASE,
        "require_lowercase": PasswordPolicy.REQUIRE_LOWERCASE,
        "require_digit": PasswordPolicy.REQUIRE_DIGIT,
        "require_special": PasswordPolicy.REQUIRE_SPECIAL,
        "special_characters": PasswordPolicy.SPECIAL_CHARACTERS,
        "requirements": PasswordPolicy.get_requirements_text(),
    }
