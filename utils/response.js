export const successResponse = (res, status, data, message, token) => {
    res.status(status).json({
        success: status >= 200 && status < 300,
        data: data,
        message: message,
        token: token
    })
}

export const errorResponse = (res, status, message, error) => {
    res.status(status).json({
        success: !(status >= 400 && status < 600),
        message: message,
        error: error
    })
}
