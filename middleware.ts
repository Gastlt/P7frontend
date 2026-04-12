import { authMiddleware } from './middleware/auth';
import { validationMiddleware } from './middleware/validation';

export function middleware(request: NextRequest) {
  // Tu lógica
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*'],
};