import { createContext, useContext } from 'react'

// The five tab screens stay mounted side by side (TabPager). This says
// whether the screen reading it is the one on screen — tours use it so a
// neighbour's walkthrough never pops up over the page you're looking at.
// Screens outside the pager are always "active".
export const PaneActiveContext = createContext(true)
export const usePaneActive = () => useContext(PaneActiveContext)
