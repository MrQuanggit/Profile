# Profile
Redirect Login
-index: 
<input type="hidden" name="redirectTo" value="{{ request()->get('redirectTo') }}">
- controller authenticate:
protected function redirectTo($request)
    {
        if (! $request->expectsJson()) {
            return route('login');
        }
    }
- AuthController:
if ($request->get('redirectTo')) {
                return redirect()->to($request->get('redirectTo'));
            }
- middleware custom authenticate:
public function handle(Request $request, Closure $next)
    {
        if(is_null(getAccessToken())) {
            return redirect()->route('auth.index', ['redirectTo' => $request->getRequestUri()]);
        }
        return $next($request);
    }
