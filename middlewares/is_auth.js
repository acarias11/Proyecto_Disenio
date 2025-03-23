import jwt from 'jsonwebtoken'

export const isAuth = (req, res, next) => {

    const authHeader = req.headers.authorization
    
    if (!authHeader) {
        res.status(401).json({
            success: false,
            message: 'Debe de iniciar sesión'
        })
    }

    const token = authHeader.split(' ')[1];

    try {
        const { role } = jwt.verify(token, process.env.SECRET_KEY)

        req.params.role = role
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: error.message
        })
    }
}
