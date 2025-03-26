export const successResponse = (res, status, data, message, error) => {
    res.status(status).json({
        success: status >= 200 && status < 300,
        data,
        message,
        error: error
    })
}

export const errorResponse = (res, status, message, error) => {
    res.status(status).json({
        success: false,
        message,
        error: error
    })
}
