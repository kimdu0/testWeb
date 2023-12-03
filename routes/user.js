const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mariadb = require('mariadb');
const pool = mariadb.createPool({
    host: 'localhost',
    user: 'sb',
    password: '123456',
    database: 'sbboard'
});

// 회원 가입 폼 보기
router.get('/register', (req, res) => {
    res.render('user/register');
});

// 회원 가입 처리
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const conn = await pool.getConnection();

        // 이미 존재하는 사용자 이름(username)인지 확인
        const checkUserQuery = "SELECT * FROM users WHERE username = ?";
        const existingUser = await conn.query(checkUserQuery, [username]);

        if (existingUser.length > 0) {
            conn.release();
            return res.status(400).send('이미 존재하는 사용자 이름입니다.'); // 이미 존재할 경우 에러 응답
        }

        // 사용자가 존재하지 않으면 회원 가입 처리
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const insertUserQuery = "INSERT INTO users (username, password) VALUES (?, ?)";
        await conn.query(insertUserQuery, [username, hashedPassword]);
        conn.release();

        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error during registration');
    }
});


// 로그인 폼 보기
router.get('/login', (req, res) => {
    const error = null;
    res.render('user/login', {error});
});

// 로그인 처리
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const conn = await pool.getConnection();
        const query = "SELECT id, username, password FROM users WHERE username = ?";
        const result = await conn.query(query, [username]);
        conn.release();

        if (result.length === 1) {
            const user = result[0];

            // 비밀번호 비교
            const match = await bcrypt.compare(password, user.password);

            if (match) {
                // 세션 설정
                req.session.username = user.username; // username을 세션에 추가

                res.redirect('/board');
            } else {
                res.render('user/login', { error: '비밀번호가 일치하지 않습니다.' });
            }
        } else {
            res.render('user/login', { error: '사용자를 찾을 수 없습니다.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error during login');
    }
});

// 로그인 폼 보기
router.get('/admin_login', (req, res) => {
    const error = null;
    res.render('user/admin_login', {error});
});

// 로그인 처리
router.post('/admin_login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const conn = await pool.getConnection();
        const query = "SELECT id, username, password FROM users WHERE username = ?";
        const result = await conn.query(query, [username]);
        conn.release();

        if (result.length === 1) {
            const user = result[0];
            let match = false;
            // 비밀번호 비교
            if (password === user.password){
                match = true;
            } else {
                match = false;
            }

            if (match) {
                // 세션 설정
                req.session.username = user.username; // username을 세션에 추가

                res.redirect('/notice');
            } else {
                res.render('user/admin_login', { error: '비밀번호가 일치하지 않습니다.' });
            }
        } else {
            res.render('user/admin_login', { error: '사용자를 찾을 수 없습니다.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error during login');
    }
});


// 로그아웃 처리
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
        }
        res.redirect('/user/login');
    });
});

module.exports = router;

