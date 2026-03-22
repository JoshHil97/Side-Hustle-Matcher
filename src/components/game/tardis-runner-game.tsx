"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

type Phase = "idle" | "running" | "gameover";

type Obstacle = {
  x: number;
  width: number;
  gapY: number;
  gapHeight: number;
  passed: boolean;
};

type Star = {
  x: number;
  y: number;
  size: number;
  speed: number;
};

type LeaderboardEntry = {
  name: string;
  score: number;
  createdAt: string;
};

type Player = {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityY: number;
};

const CANVAS_WIDTH = 420;
const CANVAS_HEIGHT = 640;
const TARDIS_WIDTH = 40;
const TARDIS_HEIGHT = 62;
const GRAVITY = 0.34;
const FLAP_VELOCITY = -6.25;
const LEADERBOARD_KEY = "tardis-runner-leaderboard-v1";
const MAX_LEADERBOARD_ENTRIES = 10;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function createInitialPlayer(): Player {
  return {
    x: 82,
    y: CANVAS_HEIGHT / 2 - TARDIS_HEIGHT / 2,
    width: TARDIS_WIDTH,
    height: TARDIS_HEIGHT,
    velocityY: 0,
  };
}

function createStars() {
  return Array.from({ length: 70 }, () => ({
    x: Math.random() * CANVAS_WIDTH,
    y: Math.random() * CANVAS_HEIGHT,
    size: 1 + Math.random() * 2.1,
    speed: 0.5 + Math.random() * 1.2,
  }));
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function sanitiseName(value: string) {
  const trimmed = value.trim().replace(/[^a-zA-Z0-9 '\-]/g, "");
  if (trimmed.length === 0) return "Time Traveller";
  return trimmed.slice(0, 22);
}

function safeParseLeaderboard(raw: string | null): LeaderboardEntry[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is LeaderboardEntry => {
        return typeof entry === "object" && entry !== null && typeof entry.name === "string" && typeof entry.score === "number" && typeof entry.createdAt === "string";
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_LEADERBOARD_ENTRIES);
  } catch {
    return [];
  }
}

function getStoredLeaderboard() {
  if (typeof window === "undefined") return [];
  return safeParseLeaderboard(window.localStorage.getItem(LEADERBOARD_KEY));
}

export function TardisRunnerGame() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [lastScore, setLastScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => getStoredLeaderboard());
  const [highScore, setHighScore] = useState(() => getStoredLeaderboard()[0]?.score ?? 0);
  const [playerName, setPlayerName] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const runFrameRef = useRef<() => void>(() => undefined);
  const frameCountRef = useRef(0);
  const playerRef = useRef<Player>(createInitialPlayer());
  const phaseRef = useRef<Phase>("idle");
  const scoreRef = useRef(0);
  const highScoreRef = useRef(highScore);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const starsRef = useRef<Star[]>([]);
  const scoreSavedForRunRef = useRef(false);

  const leaderboardEmpty = leaderboard.length === 0;

  const saveLeaderboard = useCallback((entries: LeaderboardEntry[]) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
  }, []);

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    skyGradient.addColorStop(0, "#030712");
    skyGradient.addColorStop(0.55, "#111827");
    skyGradient.addColorStop(1, "#1e1b4b");
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (const star of starsRef.current) {
      ctx.globalAlpha = 0.45 + (star.size / 3.5) * 0.45;
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.globalAlpha = 1;

    for (const obstacle of obstaclesRef.current) {
      const topHeight = obstacle.gapY;
      const bottomY = obstacle.gapY + obstacle.gapHeight;
      const bottomHeight = CANVAS_HEIGHT - bottomY;
      const obstacleGradient = ctx.createLinearGradient(obstacle.x, 0, obstacle.x + obstacle.width, 0);
      obstacleGradient.addColorStop(0, "#5b21b6");
      obstacleGradient.addColorStop(0.5, "#312e81");
      obstacleGradient.addColorStop(1, "#6d28d9");

      ctx.fillStyle = obstacleGradient;
      ctx.fillRect(obstacle.x, 0, obstacle.width, topHeight);
      ctx.fillRect(obstacle.x, bottomY, obstacle.width, bottomHeight);

      ctx.fillStyle = "#c4b5fd";
      ctx.fillRect(obstacle.x + obstacle.width - 5, 0, 5, topHeight);
      ctx.fillRect(obstacle.x + obstacle.width - 5, bottomY, 5, bottomHeight);
    }

    const player = playerRef.current;
    const centreX = player.x + player.width / 2;
    const centreY = player.y + player.height / 2;
    const angle = clamp(player.velocityY / 12, -0.45, 0.42);

    ctx.save();
    ctx.translate(centreX, centreY);
    ctx.rotate(angle);
    ctx.translate(-player.width / 2, -player.height / 2);

    const bodyGradient = ctx.createLinearGradient(0, 0, player.width, player.height);
    bodyGradient.addColorStop(0, "#1d4ed8");
    bodyGradient.addColorStop(1, "#1e3a8a");
    ctx.fillStyle = bodyGradient;
    drawRoundedRect(ctx, 0, 8, player.width, player.height - 8, 6);
    ctx.fill();

    ctx.fillStyle = "#93c5fd";
    drawRoundedRect(ctx, 10, 0, player.width - 20, 10, 3);
    ctx.fill();
    ctx.fillStyle = "#e0f2fe";
    drawRoundedRect(ctx, player.width / 2 - 3, -5, 6, 7, 2);
    ctx.fill();

    ctx.fillStyle = "#e2e8f0";
    const windowWidth = 7;
    const windowHeight = 8;
    let startY = 18;
    for (let row = 0; row < 3; row += 1) {
      const leftX = 8;
      const rightX = player.width - 8 - windowWidth;
      drawRoundedRect(ctx, leftX, startY, windowWidth, windowHeight, 2);
      ctx.fill();
      drawRoundedRect(ctx, rightX, startY, windowWidth, windowHeight, 2);
      ctx.fill();
      startY += 10;
    }

    ctx.strokeStyle = "#bfdbfe";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(player.width / 2, 12);
    ctx.lineTo(player.width / 2, player.height - 8);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "#f8fafc";
    ctx.font = "700 30px var(--font-manrope)";
    ctx.textAlign = "center";
    ctx.fillText(String(scoreRef.current), CANVAS_WIDTH / 2, 56);

    ctx.font = "600 12px var(--font-manrope)";
    ctx.textAlign = "left";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText(`High score: ${highScoreRef.current}`, 14, 28);

    if (phaseRef.current === "idle") {
      ctx.fillStyle = "rgba(2, 6, 23, 0.55)";
      drawRoundedRect(ctx, 42, CANVAS_HEIGHT / 2 - 70, CANVAS_WIDTH - 84, 150, 16);
      ctx.fill();

      ctx.fillStyle = "#f8fafc";
      ctx.textAlign = "center";
      ctx.font = "700 24px var(--font-manrope)";
      ctx.fillText("Pilot the TARDIS", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      ctx.font = "500 14px var(--font-manrope)";
      ctx.fillStyle = "#e2e8f0";
      ctx.fillText("Tap, click, or press Space/Arrow Up", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
      ctx.fillText("Fly through the time rifts", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 32);
    }

    if (phaseRef.current === "gameover") {
      ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
      drawRoundedRect(ctx, 65, CANVAS_HEIGHT / 2 - 88, CANVAS_WIDTH - 130, 180, 16);
      ctx.fill();

      ctx.fillStyle = "#f8fafc";
      ctx.textAlign = "center";
      ctx.font = "700 30px var(--font-manrope)";
      ctx.fillText("Time Crash", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 34);
      ctx.font = "500 16px var(--font-manrope)";
      ctx.fillStyle = "#e2e8f0";
      ctx.fillText(`Run score: ${scoreRef.current}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 4);
      ctx.fillText("Tap to launch another run", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 34);
    }
  }, []);

  const stopRun = useCallback(() => {
    if (phaseRef.current !== "running") return;

    phaseRef.current = "gameover";
    setPhase("gameover");
    setLastScore(scoreRef.current);
    setHighScore((previous) => Math.max(previous, scoreRef.current));

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    renderFrame();
  }, [renderFrame]);

  const resetWorldRefs = useCallback(() => {
    playerRef.current = createInitialPlayer();
    obstaclesRef.current = [];
    frameCountRef.current = 0;
    scoreRef.current = 0;
  }, []);

  const resetWorld = useCallback(() => {
    resetWorldRefs();
    setScore(0);
    setLastScore(0);
  }, [resetWorldRefs]);

  const runFrame = useCallback(() => {
    if (phaseRef.current !== "running") return;

    frameCountRef.current += 1;
    const player = playerRef.current;
    const scoreBasedSpeed = 2.4 + Math.min(scoreRef.current * 0.03, 2.2);

    starsRef.current = starsRef.current.map((star) => {
      const nextX = star.x - (star.speed + scoreBasedSpeed * 0.13);
      if (nextX >= -4) {
        return { ...star, x: nextX };
      }
      return {
        ...star,
        x: CANVAS_WIDTH + Math.random() * 34,
        y: Math.random() * CANVAS_HEIGHT,
      };
    });

    const shouldSpawnObstacle = frameCountRef.current % 96 === 0;
    const dynamicGap = clamp(186 - scoreRef.current * 1.3, 136, 190);
    const edgePadding = 64;
    const gapY = edgePadding + Math.random() * (CANVAS_HEIGHT - edgePadding * 2 - dynamicGap);

    let scoreIncrement = 0;
    const movedObstacles: Obstacle[] = obstaclesRef.current
      .map((obstacle) => {
        const movedX = obstacle.x - scoreBasedSpeed;
        const justPassed = !obstacle.passed && movedX + obstacle.width < player.x;
        if (justPassed) {
          scoreIncrement += 1;
        }
        return {
          ...obstacle,
          x: movedX,
          passed: obstacle.passed || justPassed,
        };
      })
      .filter((obstacle) => obstacle.x + obstacle.width > -12);

    obstaclesRef.current = shouldSpawnObstacle
      ? [
          ...movedObstacles,
          {
            x: CANVAS_WIDTH + 24,
            width: 74,
            gapY,
            gapHeight: dynamicGap,
            passed: false,
          },
        ]
      : movedObstacles;

    if (scoreIncrement > 0) {
      scoreRef.current += scoreIncrement;
      setScore(scoreRef.current);
    }

    player.velocityY += GRAVITY;
    player.y += player.velocityY;

    if (player.y <= 0 || player.y + player.height >= CANVAS_HEIGHT) {
      player.y = clamp(player.y, 0, CANVAS_HEIGHT - player.height);
      stopRun();
      return;
    }

    for (const obstacle of obstaclesRef.current) {
      const hitX = player.x + player.width > obstacle.x && player.x < obstacle.x + obstacle.width;
      if (!hitX) continue;

      const gapTop = obstacle.gapY;
      const gapBottom = obstacle.gapY + obstacle.gapHeight;
      const hitY = player.y < gapTop || player.y + player.height > gapBottom;
      if (hitY) {
        stopRun();
        return;
      }
    }

    renderFrame();
    animationFrameRef.current = requestAnimationFrame(() => runFrameRef.current());
  }, [renderFrame, stopRun]);
  const startRun = useCallback(
    (applyBoost: boolean) => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      resetWorld();
      setStatusMessage(null);
      scoreSavedForRunRef.current = false;
      phaseRef.current = "running";
      setPhase("running");

      if (applyBoost) {
        playerRef.current.velocityY = FLAP_VELOCITY;
      }

      renderFrame();
      animationFrameRef.current = requestAnimationFrame(() => runFrameRef.current());
    },
    [renderFrame, resetWorld],
  );

  const handleAction = useCallback(() => {
    if (phaseRef.current === "running") {
      playerRef.current.velocityY = FLAP_VELOCITY;
      return;
    }

    startRun(true);
  }, [startRun]);

  const onSaveScore = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (lastScore <= 0 || scoreSavedForRunRef.current) return;

      const name = sanitiseName(playerName);
      const entry: LeaderboardEntry = {
        name,
        score: lastScore,
        createdAt: new Date().toISOString(),
      };

      const updatedEntries = [entry, ...leaderboard].sort((a, b) => b.score - a.score).slice(0, MAX_LEADERBOARD_ENTRIES);
      setLeaderboard(updatedEntries);
      saveLeaderboard(updatedEntries);

      scoreSavedForRunRef.current = true;
      setStatusMessage(`Score saved for ${name}.`);
      setPlayerName("");

      if (entry.score > highScoreRef.current) {
        highScoreRef.current = entry.score;
        setHighScore(entry.score);
      }
    },
    [lastScore, leaderboard, playerName, saveLeaderboard],
  );

  const clearLeaderboard = useCallback(() => {
    setLeaderboard([]);
    saveLeaderboard([]);
    setHighScore(0);
    highScoreRef.current = 0;
    setStatusMessage("Leaderboard cleared.");
    if (phaseRef.current !== "running") {
      renderFrame();
    }
  }, [renderFrame, saveLeaderboard]);

  useEffect(() => {
    starsRef.current = createStars();
    resetWorldRefs();
    renderFrame();

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [renderFrame, resetWorldRefs]);

  useEffect(() => {
    runFrameRef.current = runFrame;
  }, [runFrame]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" && event.code !== "ArrowUp") return;
      event.preventDefault();
      handleAction();
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleAction]);

  useEffect(() => {
    highScoreRef.current = highScore;
  }, [highScore]);

  const scoreLabel = useMemo(() => {
    if (phase === "running") return "Current run";
    if (phase === "gameover") return "Last run";
    return "Best run";
  }, [phase]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/10 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">Time Vortex Mini Game</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Pilot the TARDIS through space</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            A quick break between applications. Fly through the time rifts and lock your score into the local leaderboard.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAction}
          className="inline-flex h-11 items-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          {phase === "running" ? "Boost TARDIS" : phase === "gameover" ? "Run again" : "Start run"}
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div>
          <div className="overflow-hidden rounded-2xl border border-slate-300 bg-[#020617] shadow-[0_14px_35px_rgba(2,6,23,0.35)]">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onPointerDown={handleAction}
              className="block h-auto w-full cursor-pointer touch-manipulation"
            />
          </div>
          <p className="mt-3 text-sm text-slate-600">Tap/click the game area, or press `Space` / `Arrow Up` to flap.</p>
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-900">Leaderboard</h3>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">Top 10 local scores</span>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-500">{scoreLabel}</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">{phase === "idle" ? highScore : phase === "running" ? score : lastScore}</p>
            <p className="mt-1 text-xs text-slate-500">High score: {highScore}</p>
          </div>

          {phase === "gameover" && (
            <form className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white p-3" onSubmit={onSaveScore}>
              <label htmlFor="playerName" className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Save this run
              </label>
              <input
                id="playerName"
                type="text"
                placeholder="Your name"
                maxLength={22}
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none ring-indigo-500 transition focus:ring-2"
              />
              <button
                type="submit"
                className="inline-flex h-10 items-center rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white transition hover:bg-indigo-600"
              >
                Save score
              </button>
            </form>
          )}

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
            {leaderboardEmpty ? (
              <p className="text-sm text-slate-500">No scores yet. Launch the first run.</p>
            ) : (
              <ol className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <li key={`${entry.createdAt}-${entry.name}-${entry.score}`} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        #{index + 1} {entry.name}
                      </p>
                      <p className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleDateString("en-GB")}</p>
                    </div>
                    <p className="text-sm font-semibold text-indigo-700">{entry.score}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={clearLeaderboard}
              className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Clear leaderboard
            </button>
            {statusMessage && <p className="text-xs text-slate-600">{statusMessage}</p>}
          </div>
        </aside>
      </div>
    </section>
  );
}
