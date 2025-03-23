
export const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        res.status(403).json({
            success: false,
            message: 'No tiene permisos para realizar esta acción'
        })
    }
    next();
}
