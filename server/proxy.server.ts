/**
 * 服务端 Proxy/Middleware 参考实现。
 *
 * 当前项目使用 `output: "export"` 静态导出，Next.js 不会加载此文件。
 * 认证由 `components/common/auth-guard.tsx` 在客户端完成；
 * Docker 部署的安全响应头由 `docker/nginx.conf` 提供。
 *
 * 如需启用服务端中间件，请将该文件移回项目根目录并移除 `output: "export"`。
 */
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createRateLimiter } from "@/lib/auth/rate-limit"
import { checkAuthAndPermissions } from "@/lib/auth/rbac"

const rateLimiter = createRateLimiter()

export async function proxy(request: NextRequest) {
  const pathname = new URL(request.url).pathname

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes("/_next/static") ||
    pathname.includes(".ico") ||
    pathname.includes(".svg")
  ) {
    return NextResponse.next()
  }

  if (pathname.startsWith("/api/")) {
    const rateLimitResult = rateLimiter(request)
    
    if (rateLimitResult) {
      return rateLimitResult
    }
  }

  const protectedPaths = ["/rooms", "/employees", "/orders", "/pos", "/members", "/products", "/inventory", "/reports", "/settings"]
  
  if (protectedPaths.some(path => pathname.startsWith(path))) {
    const authCheck = await checkAuthAndPermissions(request)
    
    if (authCheck) {
      return authCheck
    }
  }

  const response = NextResponse.next()

  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("X-XSS-Protection", "1; mode=block")

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.svg).*)",
  ],
}
