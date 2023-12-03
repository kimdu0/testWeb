const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mariadb = require('mariadb');
const pool = mariadb.createPool({
    host: 'localhost',
    user: 'sb',
    password: '123456',
    database: 'sbboard'
});

// 파일 업로드 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// 게시물 목록 보기
router.get('/', async (req, res) => {
    try {
        // 여기에서 사용자 정보를 가져오는 로직을 구현합니다.
        const user = req.session.username; // 세션에서 사용자 이름을 가져옴
        const conn = await pool.getConnection();
        const query = "SELECT * FROM notices";
        const notices = await conn.query(query);
        conn.release();

        res.render('notice/list', { notices, user }); // 사용자 정보를 템플릿에 전달
    } catch (error) {
        console.error(error);
        res.status(500).send('Error while fetching notices');
    }
});

// 검색 결과 보기
router.get('/search', async (req, res) => {
    const query = req.query.query; // 검색어를 쿼리스트링에서 가져옵니다.

    try {
        const conn = await pool.getConnection();
        const searchQuery = "SELECT * FROM notices WHERE title LIKE ?";
        const searchResults = await conn.query(searchQuery, [`%${query}%`]);
        conn.release();

        res.render('notice/search', { notices: searchResults, query });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error while searching notices');
    }
});

// 게시물 작성 폼 보기
router.get('/create', (req, res) => {
    const user = req.session.username;
    res.render('notice/create', {user});
});

// 게시물 작성 처리 (파일 업로드 포함)
router.post('/create', upload.single('file'), async (req, res) => {
    const { author, title, content } = req.body;
    const file = req.file;

    try {
        const conn = await pool.getConnection();
        if (file === undefined){
            const query = "INSERT INTO notices (author, title, content) VALUES (?, ?, ?)";
            const result = await conn.query(query, [author, title, content]);
        } else {
            const query = "INSERT INTO notices (author, title, content, file_path) VALUES (?, ?, ?, ?)";
            const result = await conn.query(query, [author, title, content, file.filename]);
        }
        
        conn.release();

        res.redirect('/notice');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error while creating a post');
    }
});

// 게시물 상세 보기
router.get('/:id', async (req, res) => {
    const postId = req.params.id;

    try {
        const conn = await pool.getConnection();
        const user = req.session.username;
        const query = "SELECT * FROM notices WHERE id = ?";
        const result = await conn.query(query, [postId]);
        conn.release();

        if (result.length === 1) {
            const post = result[0];
            res.render('notice/view', { post, user });
        } else {
            res.status(404).send('Post not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error while fetching the post');
    }
});

// 게시물 수정 폼 보기
router.get('/edit/:id', async (req, res) => {
    const postId = req.params.id;

    try {
        const conn = await pool.getConnection();
        const user = req.session.username;
        const query = "SELECT * FROM notices WHERE id = ?";
        const result = await conn.query(query, [postId]);
        conn.release();

        if (result.length === 1) {
            const post = result[0];
            res.render('notice/edit', { post, user });
        } else {
            res.status(404).send('Post not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error while fetching the post');
    }
});

// 게시물 수정 처리
router.post('/edit/:id', upload.single('file'), async (req, res) => {
    const postId = req.params.id;
    const { title, content } = req.body;
    const file = req.file;

    try {
        const conn = await pool.getConnection();
        let query = "UPDATE notices SET title = ?, content = ?";
        const params = [title, content];

        // 파일이 업로드되었을 경우에만 파일 경로를 업데이트합니다.
        if (file) {
            query += ", file_path = ?";
            params.push(file.filename);
        }

        query += " WHERE id = ?";
        params.push(postId);

        await conn.query(query, params);
        conn.release();

        res.redirect(`/notice/${postId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error while updating the post');
    }
});

// 게시물 삭제 처리
router.post('/delete/:id', async (req, res) => {
    const postId = req.params.id;

    try {
        const conn = await pool.getConnection();
        const query = "DELETE FROM notices WHERE id = ?";
        await conn.query(query, [postId]);
        conn.release();

        res.redirect('/notice');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error while deleting the post');
    }
});

// 파일 다운로드
router.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../public/uploads/', filename);

    try {
        if (fs.existsSync(filePath)) {
            res.download(filePath);
        } else {
            res.status(404).send('File not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error while downloading the file');
    }
});

module.exports = router;
