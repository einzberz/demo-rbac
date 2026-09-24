import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User } from '../models';

export const authRouter = Router();

authRouter.post('/demo-token', async (req, res, next) => {
  try {
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const user = await User.findOne({ username });
    if (!user) {
      res.status(404).json({ error: 'Demo user not found' });
      return;
    }
    const token = jwt.sign({ sub: user.id, tokenType: 'demo-access' }, config.jwtSecret, { expiresIn: '2h' });
    res.json({ accessToken: token, userId: user.id, username: user.username, expiresIn: 7200 });
  } catch (error) {
    next(error);
  }
});
