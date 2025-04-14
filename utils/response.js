export const errorResponse = (res, statusCode, message, error) => {
    res.status(statusCode).json({ 
        success: false, 
        message,
        error: error
    });
};

export const successResponse = (res, statusCode, data, message, token) => {
    return res.status(statusCode).json({
        success: true,
        message, 
        data,
        token: token
    });
};
