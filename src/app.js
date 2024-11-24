import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.log('MongoDB connect error', err));

app.set('port', process.env.PORT);

app.use(morgan('dev'));
app.use(express.json());


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        lowercase: true,
        required: true,
    },
    nickname: {
        type: String,
        unique: true,
        lowercase: true,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

const User = mongoose.model('User', userSchema);

app.post('/api/users', async (req, res, next) => {
    try {
        const { name, nickname } = req.body;

        // 입력값 검증
        if (!name || !nickname) {
            return res.status(400).json({
                success: false,
                message: '이름과 닉네임은 필수입니다.',
            });
        }

        const existingUser = await User.findOne({ nickname });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: '이미 사용중인 닉네임입니다.',
            });
        }

        const user = new User({
            name,
            nickname
        })

        await user.save();

        res.status(201).json({
            success: true,
            data: {
                name: user.name,
                nickname: user.nickname,
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
        next(error);
    }
});

app.use((err, req, res, next) => {
    console.error(err);

    const errorResponse = {
        success: false,
        message: err.message || '서버 내부 오류',
        status: err.status || 500,
        ...(process.env.NODE_ENV !== 'production' && {
            stack: err.stack,
            detail: err.detail,
        })
    };

    res.status(errorResponse.status).json(errorResponse);
});

app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기 중');
});



