const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

// 미들웨어 설정
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 정적 파일 서비스
app.use(express.static(path.join(__dirname, 'public')));

// 라우트 설정 (routes/board.js와 routes/user.js 연결 필요)
const boardRouter = require('./routes/board');
const noticeRouter = require('./routes/notice');
const userRouter = require('./routes/user');

app.use('/notice', noticeRouter);
app.use('/board', boardRouter);
app.use('/user', userRouter);

// 홈 페이지 라우트
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

