import { useEffect, useRef, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Game } from './engine/Game'
import { GameUI } from './components/GameUI'
import { Agent } from './engine/Agent'
import { chatService } from './services/chat.service'

const queryClient = new QueryClient()

async function login() {
  const response = await fetch('http://localhost:3001/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'password123',
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to login')
  }

  const data = await response.json()
  localStorage.setItem('token', data.accessToken)
  return data.accessToken
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<Game>()
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [rooms] = useState([
    {
      id: 'development',
      name: 'Development',
      type: 'DEVELOPMENT' as const,
    },
    {
      id: 'marketing',
      name: 'Marketing',
      type: 'MARKETING' as const,
    },
    {
      id: 'sales',
      name: 'Sales',
      type: 'SALES' as const,
    },
    {
      id: 'meeting',
      name: 'Meeting Room',
      type: 'MEETING' as const,
    },
  ])

  useEffect(() => {
    async function initGame() {
      if (!canvasRef.current) return

      // Login and initialize chat service
      const token = await login()
      chatService.initialize(token)

      // Initialize game
      const canvas = canvasRef.current
      const game = new Game({
        canvas,
        width: canvas.clientWidth,
        height: canvas.clientHeight,
      })

      // Store game instance
      gameRef.current = game

      // Update agents list when agents change
      game.onAgentsChange = (newAgents: Agent[]) => {
        setAgents(newAgents)
      }

      // Handle window resize
      const handleResize = () => {
        if (!canvas) return
        game.resize(canvas.clientWidth, canvas.clientHeight)
      }
      window.addEventListener('resize', handleResize)

      // Animation loop
      const animate = (time: number) => {
        game.update(time)
        game.render(time)
        requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)

      // Handle canvas click
      const handleClick = (event: MouseEvent) => {
        const rect = canvas.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top
        game.handleClick(x, y, event.button === 2)

        // Update selected agent
        setSelectedAgent(game.getSelectedAgent())
      }
      canvas.addEventListener('click', handleClick)
      canvas.addEventListener('contextmenu', (e) => e.preventDefault())

      return () => {
        window.removeEventListener('resize', handleResize)
        canvas.removeEventListener('click', handleClick)
        chatService.disconnect()
      }
    }

    initGame()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <div className="relative w-screen h-screen overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-0"
          style={{
            width: '100%',
            height: '100%',
          }}
        />

        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="relative w-full h-full">
            <GameUI 
              selectedAgent={selectedAgent}
              agents={agents}
              rooms={rooms}
              onSpeedChange={(speed) => gameRef.current?.setSimulationSpeed(speed)}
              onRandomWalkToggle={(enabled) => gameRef.current?.toggleRandomWalk(enabled)}
              onDebugToggle={(enabled) => gameRef.current?.toggleDebug(enabled)}
              onReset={() => gameRef.current?.resetSimulation()}
            />
          </div>
        </div>
      </div>
    </QueryClientProvider>
  )
}

export default App
