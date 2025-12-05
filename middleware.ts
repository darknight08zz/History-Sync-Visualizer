import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const token = request.cookies.get("auth-token")?.value;
    const { pathname } = request.nextUrl;

    // Protected routes
    const protectedPaths = ["/dashboard"];

    if (protectedPaths.some(path => pathname.startsWith(path))) {
        if (!token) {
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    // Redirect logged-in users away from auth pages
    if (token && (pathname === "/login" || pathname === "/signup" || pathname === "/")) {
        // If they visit /, login, or signup while logged in, go to dashboard
        // EXCEPT if it's the landing page ("/") we might want to let them see it?
        // Let's redirect /login and /signup only.
        if (pathname !== "/") {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
