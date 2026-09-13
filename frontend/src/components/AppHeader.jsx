export default function AppHeader({ user, onLogout, mode = 'Guest queue' }) {
  return (
    <nav className="app-header">
      <div className="app-brand">
        <span className="app-brand-mark">RL</span>
        <span>Red Lantern</span>
      </div>

      <div className="app-header-user">
        <div className="app-header-user-copy">
          <span className="app-header-mode">{mode}</span>
          <span className="app-header-name">{user.username}</span>
        </div>

        <button className="sign-out-button" onClick={onLogout}>
          Sign out
        </button>
      </div>
    </nav>
  )
}