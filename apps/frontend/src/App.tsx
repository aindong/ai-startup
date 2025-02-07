import { useEffect, useRef } from 'react'
import { Game } from './engine/Game'

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<Game | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // Initialize game
    const game = new Game({
      canvas: canvasRef.current,
      width: window.innerWidth,
      height: window.innerHeight,
    })
    gameRef.current = game

    // Handle window resize
    const handleResize = () => {
      game.resize(window.innerWidth, window.innerHeight)
      game.render(performance.now())
    }
    window.addEventListener('resize', handleResize)

    // Animation loop
    let animationFrameId: number
    const animate = (time: number) => {
      game.render(time)
      animationFrameId = requestAnimationFrame(animate)
    }
    animationFrameId = requestAnimationFrame(animate)

    // Handle canvas click events
    const handleClick = (event: MouseEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      // For testing, move the first agent to the clicked position
      const firstAgent = game.getAgent('1')
      if (firstAgent) {
        game.moveAgent('1', x, y)
      }
    }
    canvasRef.current.addEventListener('click', handleClick)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      canvasRef.current?.removeEventListener('click', handleClick)
      cancelAnimationFrame(animationFrameId)
      if (gameRef.current) {
        gameRef.current.cleanup()
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100vw',
        height: '100vh',
      }}
    />
  )
}

export default App
