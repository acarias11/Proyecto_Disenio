export const errorResponse = (res, statusCode, message) => {
    res.status(statusCode).json({ 
        success: false, 
        message 
    });
};

export const successResponse = (res, statusCode, data, message, token) => {
    res.status(statusCode).json({
        success: true,
        message, 
        data,
        token: token
    });
};
