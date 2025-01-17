/* eslint-disable react/display-name */
// src/components/FireworksCanvas.tsx
'use client'

import Matter from 'matter-js'
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'

interface Particle {
  body: Matter.Body
  imageCanvas: HTMLCanvasElement
}

export interface FireworksCanvasHandle {
  createFireworkAt: (x: number, y: number, numParticles?: number) => void
}

const FireworksCanvas = forwardRef<FireworksCanvasHandle, object>(
  (props, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const particlesRef = useRef<Particle[]>([])
    const animationFrameId = useRef<number>()
    const imagesRef = useRef<HTMLCanvasElement[]>([])
    const engineRef = useRef<Matter.Engine>()
    const worldRef = useRef<Matter.World>()
    const runnerRef = useRef<Matter.Runner>()

    // 상수 정의
    const IMAGE_SIZE = 80 // 이미지의 너비와 높이
    const OVERLAP = 5 // 이미지가 겹칠 픽셀 수
    const BODY_RADIUS = IMAGE_SIZE / 2 - OVERLAP // 물리 바디의 반지름

    // 폭죽 생성 함수
    const createFirework = useCallback(
      (x: number, y: number, numParticles: number = 50) => {
        const newParticles: Particle[] = []
        const loadedCanvases = imagesRef.current
        if (loadedCanvases.length === 0) return

        for (let i = 0; i < numParticles; i++) {
          const angle = Math.random() * Math.PI // 위쪽 반원 방향
          const speed = Math.random() * 20 + 15 // 속도 증가 (기존 10~15에서 15~25으로 증가)
          const velocity = {
            x: Math.cos(angle) * speed,
            y: -Math.sin(angle) * speed, // 위로 향하도록 y 속도 음수
          }
          // 랜덤하게 이미지 캔버스 선택
          const randomImageCanvas =
            loadedCanvases[Math.floor(Math.random() * loadedCanvases.length)]
          // 파티클 바디 생성
          const particleBody = Matter.Bodies.circle(x, y, BODY_RADIUS, {
            restitution: 0.7, // 탄성
            friction: 0.1,
            frictionAir: 0.02,
          })
          Matter.Body.setVelocity(particleBody, velocity)
          Matter.World.add(worldRef.current!, particleBody)
          newParticles.push({
            body: particleBody,
            imageCanvas: randomImageCanvas,
          })
        }
        particlesRef.current = [...particlesRef.current, ...newParticles]
      },
      [BODY_RADIUS],
    )

    useImperativeHandle(
      ref,
      () => ({
        createFireworkAt(x: number, y: number, numParticles: number = 50) {
          createFirework(x, y, numParticles)
        },
      }),
      [createFirework],
    )

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // 부모 컨테이너의 크기를 가져오기 위한 Ref 설정
      const parent = canvas.parentElement
      if (!parent) return

      // Matter.js 엔진과 월드 생성
      const engine = Matter.Engine.create()
      engine.gravity.y = 1.5 // 중력 설정
      const world = engine.world
      engineRef.current = engine
      worldRef.current = world

      // Matter.js Runner 생성 및 실행
      const runner = Matter.Runner.create()
      runnerRef.current = runner
      Matter.Runner.run(runner, engine)

      // 바닥 & 벽 만들고 월드에 추가
      let ground = Matter.Bodies.rectangle(
        parent.clientWidth / 2,
        parent.clientHeight + 25,
        parent.clientWidth,
        50,
        { isStatic: true },
      )
      let wallLeft = Matter.Bodies.rectangle(
        -25,
        parent.clientHeight / 2,
        50,
        parent.clientHeight,
        { isStatic: true },
      )
      let wallRight = Matter.Bodies.rectangle(
        parent.clientWidth + 25,
        parent.clientHeight / 2,
        50,
        parent.clientHeight,
        { isStatic: true },
      )
      Matter.World.add(world, [ground, wallLeft, wallRight])

      // 캔버스 크기 설정
      const resizeCanvas = () => {
        if (parent) {
          canvas.width = parent.clientWidth
          canvas.height = parent.clientHeight
          // 벽과 바닥 위치 업데이트
          Matter.World.remove(world, ground)
          Matter.World.remove(world, wallLeft)
          Matter.World.remove(world, wallRight)

          // 새로운 벽과 바닥 생성
          ground = Matter.Bodies.rectangle(
            parent.clientWidth / 2,
            parent.clientHeight + 25,
            parent.clientWidth,
            50,
            { isStatic: true },
          )
          wallLeft = Matter.Bodies.rectangle(
            -25,
            parent.clientHeight / 2,
            50,
            parent.clientHeight,
            { isStatic: true },
          )
          wallRight = Matter.Bodies.rectangle(
            parent.clientWidth + 25,
            parent.clientHeight / 2,
            50,
            parent.clientHeight,
            { isStatic: true },
          )
          Matter.World.add(world, [ground, wallLeft, wallRight])
        }
      }

      resizeCanvas()
      window.addEventListener('resize', resizeCanvas)

      const loadImagesToCanvas = (
        srcs: string[],
      ): Promise<HTMLCanvasElement[]> => {
        return Promise.all(
          srcs.map((src) => {
            return new Promise<HTMLCanvasElement>((resolve, reject) => {
              const img = new Image()
              img.src = src
              img.onload = () => {
                const offscreenCanvas = document.createElement('canvas')
                offscreenCanvas.width = IMAGE_SIZE
                offscreenCanvas.height = IMAGE_SIZE
                const offscreenCtx = offscreenCanvas.getContext('2d')
                if (offscreenCtx) {
                  offscreenCtx.drawImage(img, 0, 0, IMAGE_SIZE, IMAGE_SIZE)
                  resolve(offscreenCanvas)
                } else {
                  reject(new Error('Canvas context is not available'))
                }
              }
              img.onerror = () =>
                reject(new Error(`Failed to load image: ${src}`))
            })
          }),
        )
      }

      // 이미지 경로 배열
      const imagePaths = [
        '/image/popcorn1.svg',
        '/image/popcorn2.svg',
        '/image/popcorn3.svg',
        '/image/popcorn4.svg',
        '/image/popcorn_eye1.svg',
        '/image/popcorn_eye2.svg',
        '/image/popcorn_eye3.svg',
        '/image/popcorn_eye4.svg',
        '/image/santa_popcorn1.svg',
        '/image/santa_popcorn2.svg',
        '/image/santa_popcorn3.svg',
        '/image/santa_popcorn4.svg',
      ]

      loadImagesToCanvas(imagePaths)
        .then((loadedCanvases) => {
          imagesRef.current = loadedCanvases
          animate()
        })
        .catch((error) => {
          console.error(error)
        })

      // 애니메이션 루프
      const animate = () => {
        if (!ctx || imagesRef.current.length === 0) {
          animationFrameId.current = requestAnimationFrame(animate)
          return
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // 파티클 그리기
        particlesRef.current.forEach((p) => {
          const { x, y } = p.body.position
          const angle = p.body.angle
          ctx.save()
          ctx.translate(x, y)
          ctx.rotate(angle)
          ctx.drawImage(
            p.imageCanvas,
            -IMAGE_SIZE / 2,
            -IMAGE_SIZE / 2,
            IMAGE_SIZE,
            IMAGE_SIZE,
          ) // 이미지 크기 80x80으로 조정
          ctx.restore()
        })

        // 파티클 제거 조건 추가
        if (
          particlesRef.current.length > 0 &&
          particlesRef.current.every((p) => p.body.position.y <= 0)
        ) {
          // 모든 파티클 제거
          particlesRef.current.forEach((p) =>
            Matter.World.remove(world, p.body),
          )
          particlesRef.current = []
        } else {
          // 화면 상단을 벗어난 파티클 개별 제거
          particlesRef.current = particlesRef.current.filter((p) => {
            const shouldKeep = p.body.position.y > -100
            if (!shouldKeep) {
              Matter.World.remove(world, p.body)
            }
            return shouldKeep
          })
        }

        animationFrameId.current = requestAnimationFrame(animate)
      }

      return () => {
        window.removeEventListener('resize', resizeCanvas)
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current)
        }
        // Matter.js 엔진 및 월드 클린업
        Matter.World.clear(world, false)
        Matter.Engine.clear(engine)
        // Runner 정지
        if (runnerRef.current) {
          Matter.Runner.stop(runnerRef.current)
        }
        // 파티클 바디 제거
        particlesRef.current.forEach((p) => Matter.World.remove(world, p.body))
        particlesRef.current = []
      }
    }, [createFirework])

    return (
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute left-0 top-0 z-10 h-full w-full"
        style={{ display: 'block' }}
      />
    )
  },
)

export default FireworksCanvas
