import { env } from '../config/env';
import jwt from 'jsonwebtoken';

const jwtSign = (payload: { id: string; email: string; name: string | null }): Promise<string> => {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
      if (err) reject(err);
      else resolve(token as string);
    });
  });
};

const jwtVerify = async (token: string): Promise<{ id: string; email: string; name: string | null }> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, env.JWT_SECRET, (err, decoded) => {
      if (err) reject(err);
      else resolve(decoded as { id: string; email: string; name: string | null });
    });
  });
};

export { jwtSign, jwtVerify };

