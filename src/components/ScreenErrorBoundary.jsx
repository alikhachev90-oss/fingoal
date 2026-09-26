import { Component } from 'react'

// Lives in its own file so both the router and the swipe pager can wrap a
// screen without one importing the other.
export default class ScreenErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="min-h-[100svh] flex items-center justify-center p-5">
          <div className="glass rounded-[28px] p-6 text-center max-w-sm">
            <p className="text-lg font-semibold">Не удалось открыть экран</p>
            <p className="text-sm text-muted mt-2">Вернись на Главную и попробуй ещё раз.</p>
            <button type="button" onClick={() => { window.location.href = '/dashboard' }} className="mt-5 px-5 py-3 rounded-2xl bg-primary text-onprimary font-semibold">На Главную</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
