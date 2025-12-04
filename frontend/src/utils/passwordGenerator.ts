/**
 * Password Generation Utility
 * 
 * Provides secure password generation using crypto.getRandomValues()
 * with policy compliance validation and strength assessment.
 */

export interface PasswordGenerationOptions {
  length?: number;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSpecialChars?: boolean;
  specialChars?: string;
}

export interface GeneratedPassword {
  password: string;
  strength: 'weak' | 'fair' | 'good' | 'strong' | 'very_strong';
  score: number;
  meetsPolicy: boolean;
  policyErrors: string[];
}

// Password policy constants (matching backend)
const PASSWORD_POLICY = {
  MIN_LENGTH: 12,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_DIGIT: true,
  REQUIRE_SPECIAL: true,
  SPECIAL_CHARACTERS: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

/**
 * Generate a secure password using crypto.getRandomValues()
 */
export function generatePassword(options?: PasswordGenerationOptions): GeneratedPassword {
  const opts = {
    length: options?.length || PASSWORD_POLICY.MIN_LENGTH,
    includeUppercase: options?.includeUppercase ?? PASSWORD_POLICY.REQUIRE_UPPERCASE,
    includeLowercase: options?.includeLowercase ?? PASSWORD_POLICY.REQUIRE_LOWERCASE,
    includeNumbers: options?.includeNumbers ?? PASSWORD_POLICY.REQUIRE_DIGIT,
    includeSpecialChars: options?.includeSpecialChars ?? PASSWORD_POLICY.REQUIRE_SPECIAL,
    specialChars: options?.specialChars || PASSWORD_POLICY.SPECIAL_CHARACTERS
  };

  // Ensure minimum length meets policy
  const length = Math.max(opts.length, PASSWORD_POLICY.MIN_LENGTH);

  // Build character sets
  const charSets: string[] = [];
  const requiredChars: string[] = [];

  if (opts.includeUppercase) {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    charSets.push(uppercase);
    requiredChars.push(getRandomChar(uppercase));
  }

  if (opts.includeLowercase) {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    charSets.push(lowercase);
    requiredChars.push(getRandomChar(lowercase));
  }

  if (opts.includeNumbers) {
    const numbers = '0123456789';
    charSets.push(numbers);
    requiredChars.push(getRandomChar(numbers));
  }

  if (opts.includeSpecialChars) {
    charSets.push(opts.specialChars);
    requiredChars.push(getRandomChar(opts.specialChars));
  }

  if (charSets.length === 0) {
    throw new Error('At least one character set must be enabled');
  }

  // Combine all character sets
  const allChars = charSets.join('');

  // Generate password ensuring at least one character from each required set
  let password = '';
  
  // Add required characters first
  password += requiredChars.join('');

  // Fill remaining length with random characters from all sets
  const remainingLength = length - requiredChars.length;
  for (let i = 0; i < remainingLength; i++) {
    password += getRandomChar(allChars);
  }

  // Shuffle the password to avoid predictable patterns
  password = shuffleString(password);

  // Validate and assess the generated password
  const policyErrors = validatePasswordPolicy(password);
  const meetsPolicy = policyErrors.length === 0;
  const { strength, score } = calculatePasswordStrength(password);

  return {
    password,
    strength,
    score,
    meetsPolicy,
    policyErrors
  };
}

/**
 * Get a random character from a character set using crypto.getRandomValues()
 */
function getRandomChar(charSet: string): string {
  if (!charSet || charSet.length === 0) {
    throw new Error('Character set cannot be empty');
  }

  // Use crypto.getRandomValues for secure random generation
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const randomIndex = array[0] % charSet.length;
    return charSet[randomIndex];
  } else {
    // Fallback for environments without crypto API (should not happen in modern browsers)
    console.warn('crypto.getRandomValues not available, falling back to Math.random()');
    const randomIndex = Math.floor(Math.random() * charSet.length);
    return charSet[randomIndex];
  }
}

/**
 * Shuffle a string using Fisher-Yates algorithm with crypto.getRandomValues()
 */
function shuffleString(str: string): string {
  const array = str.split('');
  
  for (let i = array.length - 1; i > 0; i--) {
    let randomIndex: number;
    
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const randomArray = new Uint32Array(1);
      crypto.getRandomValues(randomArray);
      randomIndex = randomArray[0] % (i + 1);
    } else {
      // Fallback
      randomIndex = Math.floor(Math.random() * (i + 1));
    }
    
    // Swap elements
    [array[i], array[randomIndex]] = [array[randomIndex], array[i]];
  }
  
  return array.join('');
}

/**
 * Validate password against policy requirements
 */
function validatePasswordPolicy(password: string): string[] {
  const errors: string[] = [];

  // Check minimum length
  if (password.length < PASSWORD_POLICY.MIN_LENGTH) {
    errors.push(`At least ${PASSWORD_POLICY.MIN_LENGTH} characters long`);
  }

  // Check for uppercase letter
  if (PASSWORD_POLICY.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('At least one uppercase letter (A-Z)');
  }

  // Check for lowercase letter
  if (PASSWORD_POLICY.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('At least one lowercase letter (a-z)');
  }

  // Check for digit
  if (PASSWORD_POLICY.REQUIRE_DIGIT && !/\d/.test(password)) {
    errors.push('At least one number (0-9)');
  }

  // Check for special character
  if (PASSWORD_POLICY.REQUIRE_SPECIAL) {
    const hasSpecialChar = password.split('').some(char => 
      PASSWORD_POLICY.SPECIAL_CHARACTERS.includes(char)
    );
    if (!hasSpecialChar) {
      errors.push(`At least one special character (${PASSWORD_POLICY.SPECIAL_CHARACTERS})`);
    }
  }

  return errors;
}

/**
 * Calculate password strength (matching backend algorithm)
 */
function calculatePasswordStrength(password: string): { strength: 'weak' | 'fair' | 'good' | 'strong' | 'very_strong', score: number } {
  let score = 0;

  // Length score (up to 30 points)
  if (password.length >= PASSWORD_POLICY.MIN_LENGTH) {
    score += 15;
  }
  if (password.length >= 16) {
    score += 10;
  }
  if (password.length >= 20) {
    score += 5;
  }

  // Character variety (up to 40 points)
  if (/[a-z]/.test(password)) {
    score += 10;
  }
  if (/[A-Z]/.test(password)) {
    score += 10;
  }
  if (/\d/.test(password)) {
    score += 10;
  }
  if (password.split('').some(char => PASSWORD_POLICY.SPECIAL_CHARACTERS.includes(char))) {
    score += 10;
  }

  // Complexity bonus (up to 30 points)
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= 8) {
    score += 10;
  }
  if (uniqueChars >= 12) {
    score += 10;
  }
  if (uniqueChars >= 16) {
    score += 10;
  }

  // Determine strength label
  let strength: 'weak' | 'fair' | 'good' | 'strong' | 'very_strong';
  if (score < 40) {
    strength = 'weak';
  } else if (score < 60) {
    strength = 'fair';
  } else if (score < 75) {
    strength = 'good';
  } else if (score < 90) {
    strength = 'strong';
  } else {
    strength = 'very_strong';
  }

  return { strength, score };
}

/**
 * Generate multiple password options for user to choose from
 */
export function generatePasswordOptions(count: number = 3, options?: PasswordGenerationOptions): GeneratedPassword[] {
  const passwords: GeneratedPassword[] = [];
  
  for (let i = 0; i < count; i++) {
    // Vary the length slightly for different options
    const lengthVariation = options?.length || PASSWORD_POLICY.MIN_LENGTH + (i * 2);
    const optionsWithVariation = {
      ...options,
      length: lengthVariation
    };
    
    passwords.push(generatePassword(optionsWithVariation));
  }
  
  // Sort by strength score (highest first)
  return passwords.sort((a, b) => b.score - a.score);
}

/**
 * Check if crypto.getRandomValues is available
 */
export function isCryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function';
}

/**
 * Get password policy requirements as text array (local fallback)
 * Prefer fetching from backend API for up-to-date requirements
 */
export function getPasswordRequirements(): string[] {
  return [
    `At least ${PASSWORD_POLICY.MIN_LENGTH} characters long`,
    'At least one uppercase letter (A-Z)',
    'At least one lowercase letter (a-z)',
    'At least one number (0-9)',
    `At least one special character (${PASSWORD_POLICY.SPECIAL_CHARACTERS})`
  ];
}

/**
 * Fetch password policy from backend API
 */
export async function fetchPasswordPolicy(): Promise<{
  requirements: string[];
  minLength: number;
  specialChars: string;
}> {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/password-policy`);
    if (!response.ok) {
      throw new Error('Failed to fetch password policy');
    }
    return await response.json();
  } catch (error) {
    console.warn('Failed to fetch password policy from backend, using local defaults:', error);
    return {
      requirements: getPasswordRequirements(),
      minLength: PASSWORD_POLICY.MIN_LENGTH,
      specialChars: PASSWORD_POLICY.SPECIAL_CHARACTERS
    };
  }
}