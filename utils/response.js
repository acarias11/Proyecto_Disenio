export const errorResponse = (res, statusCode, message) => {
    res.status(statusCode).json({ success: false, message });
};

export const successResponse = (res, statusCode, data, message, token = null) => {
    const response = { success: true, message, data };
    if (token) {
        response.token = token;
    }
    res.status(statusCode).json(response);
};
