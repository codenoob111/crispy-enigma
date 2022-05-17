const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config({
    path: './config.env'
});
const app = require('./app');

// process.on('uncaughtException',err => {
//     console.log('UnCaught Exception! shutting down...');
//     console.log(err.name, err.message);
//     process.exit(1);
// })

//获取数据库地址
const db = process.env.DATABASE_LOCAL;
//连接本地数据库
mongoose.connect(db, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}).then(() => console.log('database connect success!'));

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`server is running at ${port}...`);
});

//全局错误处理 非express和数据库的错误
// process.on('unhandledRejection', err => {
//     console.log('Unhandle Rejection! shutting down...');
//     console.log(err.name, err.message);
//     //先关闭服务器
//     server.close(() => {
//         //再退出程序
//         process.exit(1);
//     });
// });

