import { Component } from 'react'
import { translate } from '../i18n/strings'

// Lives in its own file so both the router and the swipe pager can wrap a
// screen without one importing the other.
export default class ScreenErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      let lang = 'ru'
      try { lang = localStorage.getItem('fintrack_lang') || 'ru' } catch { /* storage off */ }
      return (
        <div className="min-h-[100svh] flex items-center justify-center p-5">
          <div className="glass rounded-[28px] p-6 text-center max-w-sm">
            <p className="text-lg font-semibold">{translate('common.screenErrorTitle', lang)}</p>
            <p className="text-sm text-muted mt-2">{translate('common.screenErrorBody', lang)}</p>
            <button type="button" onClick={() => { window.location.href = '/dashboard' }} className="mt-5 px-5 py-3 rounded-2xl bg-primary text-onprimary font-semibold">{translate('nav.overview', lang)}</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
