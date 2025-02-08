import { useEffect, useRef } from 'react'
import { Game } from './engine/Game'

async function login() {
  try {
    const response = await fetch('http://localhost:3001/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      }),
    });

    if (!response.ok) {
      // If registration fails (e.g., user exists), try logging in
      const loginResponse = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      if (!loginResponse.ok) {
        throw new Error('Authentication failed');
      }

      const data = await loginResponse.json();
      localStorage.setItem('token', data.accessToken);
      return data.accessToken;
    }

    const data = await response.json();
    localStorage.setItem('token', data.accessToken);
    return data.accessToken;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<Game | null>(null)

  useEffect(() => {
    async function initGame() {
      // Get authentication token
      const token = await login();
      if (!token) {
        console.error('Failed to authenticate');
        return;
      }

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
    }

    initGame()
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
