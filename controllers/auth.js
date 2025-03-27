// importar donde se obtendran los usuarios
import jsonwebtoken from 'jsonwebtoken';

//! TO DO

export default class AuthController {
    static login = async (req, res) => {
        const { username, password } = req.body;

        if (username !== "" || password !== "") {
            res.status(401).json({ 
                success: false, 
                message: "Credenciales incorrectas" });
        }

        const token = jsonwebtoken.sign({
            'username': '',
            "role": ''
        }, process.env.SECRET_KEY)

        res.status(200).json({ 
            success: true, 
            token: token
        });
    }
}
