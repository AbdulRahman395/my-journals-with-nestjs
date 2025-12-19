export const message = {
    // 200 Success
    fetchSuccess: 'Data fetched successfully.',
    requestSuccess: 'Request processed successfully.',
    loginSuccess: 'Login successful.',
    logoutSuccess: 'Logged out successfully.',
    passwordResetSuccess: 'Password reset successfully.',
    passwordChangeSuccess: 'Password changed successfully.',
    dataSaveSuccess: 'Data saved successfully.',
    dataUpdateSuccess: 'Data updated successfully.',
    accountCreated: 'Account created successfully.',
    accountUpdated: 'Account updated successfully.',
    deleteSuccess: 'Deleted successfully.',
    operationSuccess: 'Operation completed successfully.',
    verificationSuccess: 'Verified successfully.',
    otpSent: 'OTP sent successfully.',
    recordUpdated: 'Record updated successfully.',
    importSuccess: 'Import successful.',
    exportSuccess: 'Export successful.',

    // 400 Bad Request
    invalidRequest: 'Invalid request.',
    insufficientBalance: 'Insufficient balance.',
    validationError: 'Validation failed. Please check your input fields.',
    missingRequiredFields: 'Please enter all required fields.',
    invalidCredentials: 'Invalid credentials provided.',
    incorrectPassword: 'Incorrect password.',
    invalidOrExpiredOTP: 'Invalid or expired OTP.',
    noFileProvided: 'No file provided.',
    noImageUploaded: 'No image uploaded.',
    phoneRequired: 'Phone number is required.',
    otpRequired: 'OTP is required for verification.',
    newPasswordMustDiffer: 'New password must be different from old password.',
    invalidStatus: 'Invalid status. Must be either "approved" or "rejected".',
    productNotFound: 'Product not found.',
    alreadyReported: 'You have already reported this product.',
    otpOrBackupCodeRequired: 'OTP or backup code is required for authentication.',
    noValidBackupCodesFound: 'No valid backup codes found.',
    invalidRole: 'Invalid role. Role must be either "user" or "vendor".',

    // 401 Unauthorized
    unauthorizedAccess: 'Unauthorized access.',
    tokenMissing: 'No token provided.',
    invalidToken: 'Invalid token.',
    tokenExpired: 'Session expired. Please log in again.',
    userNotFound: 'User not found.',
    unverified: 'User is not verified.',
    accountBlocked: 'Your account is blocked.',

    // 403 Forbidden
    forbidden: 'Forbidden: You do not have permission to perform this action.',

    // 404 Not Found
    notFound: 'Details not found.',

    // 409 Conflict
    alreadyExists: 'Already exists.',
    emailExists: 'Email already exists.',
    phoneExists: 'Phone number already exists.',

    // 500 Internal Server Error
    internalServerError: 'Internal server error. Please try again later.',
    unexpectedError: 'Something went wrong: server error.',
    operationFailed: 'Operation failed. Please try again later.',
};

export const statusCode = {
    success: 200,
    created: 201,
    noContent: 204,
    badRequest: 400,
    unauthorized: 401,
    forbidden: 403,
    notFound: 404,
    conflict: 409,
    internalServerError: 500,
};

export const userRole = {
    superAdmin: 'superAdmin',
    vendor: 'vendor',
    user: 'user',
};
