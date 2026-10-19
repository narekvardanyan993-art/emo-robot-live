/********************************************************************
 * ВЕКТОРНЫЙ РЕНДЕРЕР ПОЛНОЭКРАННОГО ЛИЦА EMO, СЮЖЕТНЫЕ СЦЕНЫ И ЦИКЛ АНИМАЦИИ
 ********************************************************************/
const canvas = document.getElementById('emo-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resizeCanvas);

function drawRoundedRectPath(context, x, y, w, h, r) {
    const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + w - radius, y);
    context.quadraticCurveTo(x + w, y, x + w, y + radius);
    context.lineTo(x + w, y + h - radius);
    context.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    context.lineTo(x + radius, y + h);
    context.quadraticCurveTo(x, y + h, x, y + h - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
}

function drawAuthenticEmoHappyArch(context, w, h, archAmount) {
    const hw = w * 0.52;
    const thickness = Math.max(18, h * (0.34 - archAmount * 0.05));
    const peakY = -h * 0.42 * archAmount;
    const footY = h * 0.22 * archAmount;

    context.beginPath();
    context.moveTo(-hw, footY);
    context.bezierCurveTo(-hw * 0.55, peakY - thickness * 0.85, hw * 0.55, peakY - thickness * 0.85, hw, footY);
    context.bezierCurveTo(hw + thickness * 0.22, footY + thickness * 0.55, hw - thickness * 0.15, footY + thickness * 0.95, hw - thickness * 0.45, footY + thickness * 0.65);
    context.bezierCurveTo(hw * 0.35, peakY + thickness * 0.45, -hw * 0.35, peakY + thickness * 0.45, -hw + thickness * 0.45, footY + thickness * 0.65);
    context.bezierCurveTo(-hw + thickness * 0.15, footY + thickness * 0.95, -hw - thickness * 0.22, footY + thickness * 0.55, -hw, footY);
    context.closePath();
}

function drawSlantedEyePolygon(context, w, h, topLeftDrop, topRightDrop, bottomTrim = 0) {
    const x = -w / 2;
    const y = -h / 2;
    const r = Math.min(w * 0.26, h * 0.26, 36);
    const yTL = y + topLeftDrop * h;
    const yTR = y + topRightDrop * h;
    const yBot = y + h * (1 - bottomTrim);

    context.beginPath();
    context.moveTo(x + r, yTL);
    context.lineTo(x + w - r, yTR);
    context.quadraticCurveTo(x + w, yTR, x + w, yTR + r);
    context.lineTo(x + w, yBot - r);
    context.quadraticCurveTo(x + w, yBot, x + w - r, yBot);
    context.lineTo(x + r, yBot);
    context.quadraticCurveTo(x, yBot, x, yBot - r);
    context.lineTo(x, yTL + r);
    context.quadraticCurveTo(x, yTL, x + r, yTL);
    context.closePath();
}

function drawHeartShape(context, cx, cy, size) {
    context.save();
    context.translate(cx, cy - size * 0.32);
    context.beginPath();
    context.moveTo(0, size * 0.28);
    context.bezierCurveTo(0, 0, -size * 0.55, 0, -size * 0.55, size * 0.32);
    context.bezierCurveTo(-size * 0.55, size * 0.62, 0, size * 0.85, 0, size * 1.05);
    context.bezierCurveTo(0, size * 0.85, size * 0.55, size * 0.62, size * 0.55, size * 0.32);
    context.bezierCurveTo(size * 0.55, 0, 0, 0, 0, size * 0.28);
    context.closePath();
    context.fill();
    context.restore();
}

function drawVectorEye(eye, isLeft, centerX, centerY, baseW, baseH, color) {
    const w = Math.max(14, baseW * eye.scaleX.val);
    const h = Math.max(8, baseH * eye.scaleY.val);

    ctx.save();
    ctx.translate(centerX + eye.offsetX.val, centerY + eye.offsetY.val);
    ctx.rotate(headTilt.val);

    ctx.shadowColor = color;
    ctx.shadowBlur = 38;
    ctx.fillStyle = color;
    ctx.strokeStyle = color;

    if (currentState === 'love' && !isThinkingAI) {
        const pulse = 1 + Math.sin(globalTime * 8) * 0.11;
        drawHeartShape(ctx, 0, 0, Math.min(w, h) * 0.96 * pulse);
        ctx.restore();
        return;
    }

    if (currentState === 'dizzy' && !isThinkingAI) {
        ctx.lineWidth = Math.max(8, w * 0.11);
        ctx.lineCap = 'round';
        const dir = isLeft ? 1 : -1;
        ctx.rotate(globalTime * 6.5 * dir);
        ctx.beginPath();
        const maxR = Math.min(w, h) * 0.48;
        for (let a = 0; a < Math.PI * 5.2; a += 0.15) {
            const rad = (a / (Math.PI * 5.2)) * maxR;
            const px = Math.cos(a) * rad;
            const py = Math.sin(a) * rad;
            if (a === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.restore();
        return;
    }

    if (currentState === 'shock' && !isThinkingAI) {
        const jitterX = (Math.random() - 0.5) * 6;
        const jitterY = (Math.random() - 0.5) * 6;
        const ringR = Math.min(w, h) * 0.38;
        ctx.lineWidth = Math.max(10, w * 0.15);
        ctx.beginPath();
        ctx.arc(jitterX, jitterY, ringR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        return;
    }

    if (currentState === 'cyber' && !isLeft && !isThinkingAI) {
        const r = Math.min(w, h) * 0.46;
        ctx.strokeStyle = '#FF2A54';
        ctx.shadowColor = '#FF2A54';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2);
        ctx.fillStyle = '#FF2A54';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-r * 1.35, 0); ctx.lineTo(r * 1.35, 0);
        ctx.moveTo(0, -r * 1.35); ctx.lineTo(0, r * 1.35);
        ctx.stroke();
        ctx.restore();
        return;
    }

    if (eye.happyCurve.val > 0.35 && !isThinkingAI) {
        drawAuthenticEmoHappyArch(ctx, w, h, eye.happyCurve.val);
        ctx.fill();
        ctx.restore();
        return;
    }

    const slIn = eye.topSlantInner.val;
    const slOut = eye.topSlantOuter.val;
    if ((slIn > 0.04 || slOut > 0.04) && !isThinkingAI) {
        const topLeftDrop = isLeft ? slOut : slIn;
        const topRightDrop = isLeft ? slIn : slOut;
        const botTrim = (currentState === 'demon') ? 0.25 : (currentState === 'angry' ? 0.14 : 0);
        drawSlantedEyePolygon(ctx, w, h, topLeftDrop, topRightDrop, botTrim);
        ctx.fill();
        ctx.restore();
        return;
    }

    const openTop = eye.topLid.val * h;
    const openBot = eye.bottomLid.val * h;
    const visibleH = Math.max(8, h - openTop - openBot);
    const topY = -h / 2 + openTop;
    const cornerR = Math.min(w * 0.32, visibleH * 0.45);

    drawRoundedRectPath(ctx, -w / 2, topY, w, visibleH, cornerR);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.24)';
    const glintW = w * 0.22;
    const glintH = Math.min(visibleH * 0.18, h * 0.13);
    if (visibleH > 28) {
        drawRoundedRectPath(ctx, -w * 0.28, topY + visibleH * 0.12, glintW, glintH, glintH / 2);
        ctx.fill();
    }

    ctx.restore();
}

function drawThinkingNeuralPulse(w, h, centerX, centerY, baseEyeH) {
    if (!isThinkingAI) return;
    ctx.save();
    const ny = centerY - baseEyeH * 0.78;
    ctx.translate(centerX, ny);

    for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.rotate(globalTime * (3 + i) * (i % 2 === 0 ? 1 : -1));
        ctx.strokeStyle = i === 0 ? currentColor : '#A855F7';
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 18;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, 0, 22 + i * 9, 0, Math.PI * 1.15);
        ctx.stroke();
        ctx.restore();
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('AI THINKING...', 0, 56);
    ctx.restore();
}

function drawDemonScene(w, h, centerX, centerY, eyeSpan, baseEyeW, baseEyeH) {
    ctx.save();
    const hornColor = '#FF2A54';
    ctx.fillStyle = hornColor;
    ctx.shadowColor = hornColor;
    ctx.shadowBlur = 32;

    [-1, 1].forEach(dir => {
        ctx.save();
        ctx.translate(centerX + dir * (eyeSpan + baseEyeW * 0.18), centerY - baseEyeH * 0.56);
        ctx.scale(dir, 1);
        ctx.rotate(Math.sin(globalTime * 14) * 0.05);

        ctx.beginPath();
        ctx.moveTo(-24, 18);
        ctx.quadraticCurveTo(10, -68, 68, -88);
        ctx.quadraticCurveTo(28, -18, 18, 24);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    });

    ctx.save();
    ctx.translate(centerX + leftEye.offsetX.val * 0.4, centerY + baseEyeH * 0.64 + Math.sin(globalTime * 22) * 6);
    ctx.strokeStyle = hornColor;
    ctx.fillStyle = hornColor;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    const mw = baseEyeW * 0.92;
    ctx.beginPath();
    ctx.moveTo(-mw, -14);
    ctx.quadraticCurveTo(0, 34, mw, -14);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-mw * 0.65, -3);
    ctx.lineTo(-mw * 0.48, 26);
    ctx.lineTo(-mw * 0.30, 3);
    ctx.moveTo(mw * 0.65, -3);
    ctx.lineTo(mw * 0.48, 26);
    ctx.lineTo(mw * 0.30, 3);
    ctx.fill();
    ctx.restore();

    if (Math.random() < 0.45) {
        particles.push({
            type: 'ember',
            x: centerX + (Math.random() - 0.5) * w * 0.75,
            y: h + 10,
            vx: (Math.random() - 0.5) * 2.5,
            vy: -3 - Math.random() * 4.5,
            size: 4 + Math.random() * 6,
            alpha: 1
        });
    }
    ctx.restore();
}

function drawAngelScene(centerX, centerY, baseEyeW, baseEyeH) {
    ctx.save();
    const floatY = Math.sin(globalTime * 4) * 8;
    ctx.translate(centerX + leftEye.offsetX.val * 0.4, centerY - baseEyeH * 0.78 + floatY);
    ctx.strokeStyle = '#FACC15';
    ctx.shadowColor = '#FACC15';
    ctx.shadowBlur = 32;
    ctx.lineWidth = 9;

    ctx.beginPath();
    ctx.ellipse(0, 0, baseEyeW * 0.9, baseEyeH * 0.16, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

function drawCyborgScene(w, centerX, centerY, eyeSpan) {
    ctx.save();
    const rx = centerX + eyeSpan + rightEye.offsetX.val;
    const ry = centerY + rightEye.offsetY.val;
    ctx.strokeStyle = '#FF2A54';
    ctx.shadowColor = '#FF2A54';
    ctx.shadowBlur = 18;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, ry);
    ctx.lineTo(w, ry);
    ctx.stroke();

    if (Math.sin(globalTime * 8) > 0.3) {
        ctx.strokeStyle = '#FF2A54';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(centerX + gazeTargetX * 260, centerY + gazeTargetY * 180);
        ctx.stroke();
    }
    ctx.restore();
}

function drawStoryOverlays(w, h, centerX, centerY, eyeSpan, baseEyeW, baseEyeH) {
    if (isThinkingAI) {
        drawThinkingNeuralPulse(w, h, centerX, centerY, baseEyeH);
        return;
    }

    if (activeHologram && activeHologram.timer > 0) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.fillStyle = 'rgba(4, 8, 16, 0.90)';
        ctx.strokeStyle = currentColor;
        ctx.shadowColor = currentColor;
        ctx.shadowBlur = 30;
        ctx.lineWidth = 3.5;
        drawRoundedRectPath(ctx, -180, -110, 360, 220, 32);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (activeHologram.type === 'coin') {
            const flip = Math.abs(Math.cos(globalTime * 10));
            ctx.save();
            ctx.scale(0.25 + flip * 0.75, 1);
            ctx.fillStyle = '#FACC15';
            ctx.beginPath();
            ctx.arc(0, -18, 44, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            ctx.fillStyle = '#FACC15';
            ctx.font = 'bold 24px "JetBrains Mono", monospace';
            ctx.fillText(activeHologram.data.label, 0, 62);
        } else if (activeHologram.type === 'dice') {
            ctx.fillStyle = currentColor;
            ctx.font = 'bold 68px "JetBrains Mono", monospace';
            ctx.fillText(`🎲 ${activeHologram.data.value}`, 0, -10);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 18px "Inter", sans-serif';
            ctx.fillText(`ВЫПАЛО ЧИСЛО: ${activeHologram.data.value}`, 0, 64);
        } else if (activeHologram.type === 'rps') {
            ctx.font = '74px sans-serif';
            ctx.fillText(activeHologram.data.icon, 0, -14);
            ctx.fillStyle = currentColor;
            ctx.font = 'bold 24px "JetBrains Mono", monospace';
            ctx.fillText(activeHologram.data.name, 0, 64);
        } else if (activeHologram.type === 'time') {
            const tNow = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            ctx.fillStyle = currentColor;
            ctx.font = 'bold 46px "JetBrains Mono", monospace';
            ctx.fillText(tNow, 0, -8);
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = '600 14px "Inter", sans-serif';
            ctx.fillText('EMO INTERNAL CLOCK', 0, 56);
        }
        ctx.restore();
    }

    if (sound.isSpeakingNow) {
        ctx.save();
        const bars = 15;
        const gap = 9;
        const barW = 10;
        const totalW = bars * (barW + gap);
        const startX = centerX - totalW / 2;
        const mouthY = centerY + baseEyeH * 0.72;

        for (let i = 0; i < bars; i++) {
            const centerDist = 1 - Math.abs(i - (bars - 1) / 2) / ((bars - 1) / 2);
            const wave = (Math.sin(globalTime * 28 + i * 0.9) * 0.5 + 0.5);
            const bh = Math.max(6, (8 + wave * 38) * centerDist);
            ctx.fillStyle = currentColor;
            ctx.shadowColor = currentColor;
            ctx.shadowBlur = 16;
            drawRoundedRectPath(ctx, startX + i * (barW + gap), mouthY - bh / 2, barW, bh, 5);
            ctx.fill();
        }
        ctx.restore();
    }

    if (currentState === 'demon') drawDemonScene(w, h, centerX, centerY, eyeSpan, baseEyeW, baseEyeH);
    if (currentState === 'angel') drawAngelScene(centerX, centerY, baseEyeW, baseEyeH);
    if (currentState === 'cyber') drawCyborgScene(w, centerX, centerY, eyeSpan);

    if (currentState === 'sad') {
        if (Math.random() < 0.2) {
            const side = Math.random() > 0.5 ? -1 : 1;
            particles.push({
                type: 'tear',
                x: centerX + side * eyeSpan + (Math.random() - 0.5) * 35,
                y: centerY + baseEyeH * 0.38,
                vx: (Math.random() - 0.5) * 0.6,
                vy: 3.2 + Math.random() * 2.5,
                size: 8,
                alpha: 1
            });
        }
    }

    if (currentState === 'love' || currentState === 'petting') {
        if (Math.random() < 0.16) {
            particles.push({
                type: 'heart',
                x: centerX + (Math.random() - 0.5) * (eyeSpan * 2.6),
                y: centerY + baseEyeH * 0.3,
                vx: (Math.random() - 0.5) * 1.5,
                vy: -2.2 - Math.random() * 1.8,
                size: 18 + Math.random() * 14,
                alpha: 1
            });
        }
    }

    if (currentState === 'sleep') {
        if (Math.random() < 0.05) {
            particles.push({
                type: 'zzz',
                x: centerX + eyeSpan * 1.05,
                y: centerY - 20,
                vx: 1.2,
                vy: -1.6,
                size: 24,
                alpha: 1
            });
        }
    }

    if (currentState === 'eat') {
        const bx = centerX;
        const by = centerY + baseEyeH * 0.68 + Math.sin(globalTime * 10) * 7;
        const bitePhase = Math.floor((stateTimer * 1.8) % 4);
        if (bitePhase < 3) {
            ctx.save();
            ctx.translate(bx, by);
            const sc = (1 - bitePhase * 0.22) * 1.35;
            ctx.scale(sc, sc);
            ctx.shadowBlur = 18;

            ctx.fillStyle = '#FB923C';
            ctx.shadowColor = '#FB923C';
            ctx.beginPath();
            ctx.arc(0, -8, 34, Math.PI, 0);
            ctx.fill();

            ctx.fillStyle = '#34D399';
            ctx.fillRect(-36, -6, 72, 6);
            ctx.fillStyle = '#FF2A54';
            ctx.fillRect(-32, 0, 64, 9);
            ctx.fillStyle = '#FB923C';
            drawRoundedRectPath(ctx, -32, 9, 64, 12, 6);
            ctx.fill();
            ctx.restore();
        }
    }

    if (currentState === 'clean') {
        const wipeX = centerX + Math.sin(globalTime * 4.5) * (eyeSpan * 1.25);
        const wipeY = centerY + Math.cos(globalTime * 2.2) * (baseEyeH * 0.35);

        if (Math.random() < 0.38) {
            particles.push({
                type: 'bubble',
                x: wipeX + (Math.random() - 0.5) * 60,
                y: wipeY + (Math.random() - 0.5) * 60,
                vx: (Math.random() - 0.5) * 1.2,
                vy: -1.1 - Math.random(),
                size: 7 + Math.random() * 12,
                alpha: 0.9
            });
        }

        ctx.save();
        ctx.translate(wipeX, wipeY);
        ctx.rotate(Math.sin(globalTime * 4.5) * 0.22);
        ctx.fillStyle = '#FACC15';
        ctx.shadowColor = '#FACC15';
        ctx.shadowBlur = 24;
        drawRoundedRectPath(ctx, -46, -28, 92, 56, 14);
        ctx.fill();
        ctx.restore();
    }

    if (currentState === 'laser') {
        laserDot.x += laserDot.vx;
        laserDot.y += laserDot.vy;
        if (laserDot.x < 60 || laserDot.x > w - 60) laserDot.vx *= -1;
        if (laserDot.y < 80 || laserDot.y > h - 180) laserDot.vy *= -1;

        gazeTargetX = (laserDot.x - centerX) / (w * 0.35);
        gazeTargetY = (laserDot.y - centerY) / (h * 0.35);

        ctx.save();
        ctx.fillStyle = '#FF2A54';
        ctx.shadowColor = '#FF2A54';
        ctx.shadowBlur = 26;
        ctx.beginPath();
        ctx.arc(laserDot.x, laserDot.y, 12, 0, Math.PI * 2);
        ctx.fill();

        if (stateTimer > 1.8 && Math.sin(globalTime * 12) > 0.45) {
            if (!laserDot.firing) {
                sound.sfxLaser();
                laserDot.firing = true;
            }
            ctx.strokeStyle = '#00F2FE';
            ctx.shadowColor = '#00F2FE';
            ctx.lineWidth = 7;
            ctx.beginPath();
            ctx.moveTo(centerX - eyeSpan + leftEye.offsetX.val, centerY + leftEye.offsetY.val);
            ctx.lineTo(laserDot.x, laserDot.y);
            ctx.moveTo(centerX + eyeSpan + rightEye.offsetX.val, centerY + rightEye.offsetY.val);
            ctx.lineTo(laserDot.x, laserDot.y);
            ctx.stroke();
        } else {
            laserDot.firing = false;
        }
        ctx.restore();
    }

    if (currentState === 'sneeze') {
        const bubbleR = 20 + Math.sin(globalTime * 5) * 8;
        ctx.save();
        ctx.strokeStyle = '#00F2FE';
        ctx.fillStyle = 'rgba(0, 242, 254, 0.22)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(centerX + eyeSpan * 0.48, centerY + baseEyeH * 0.5, bubbleR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    if (currentState === 'music') {
        ctx.save();
        const glassesY = centerY + leftEye.offsetY.val * 0.5 + Math.sin(globalTime * 14) * 7;
        ctx.translate(centerX + leftEye.offsetX.val * 0.6, glassesY);
        ctx.rotate(headTilt.val);

        ctx.strokeStyle = '#FF2A54';
        ctx.fillStyle = 'rgba(255, 42, 84, 0.20)';
        ctx.shadowColor = '#FF2A54';
        ctx.shadowBlur = 24;
        ctx.lineWidth = 6;

        const gw = eyeSpan * 2 + baseEyeW * 1.08;
        const gh = baseEyeH * 0.68;
        drawRoundedRectPath(ctx, -gw / 2, -gh / 2, gw * 0.44, gh, 18);
        ctx.fill(); ctx.stroke();
        drawRoundedRectPath(ctx, gw * 0.06, -gh / 2, gw * 0.44, gh, 18);
        ctx.fill(); ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-gw * 0.06, -gh * 0.1);
        ctx.lineTo(gw * 0.06, -gh * 0.1);
        ctx.stroke();
        ctx.restore();

        const bars = 16;
        const eqW = Math.min(w * 0.55, 520);
        const barW = eqW / bars;
        const startX = centerX - eqW / 2;
        ctx.save();
        for (let i = 0; i < bars; i++) {
            const bh = 12 + Math.abs(Math.sin(globalTime * 12 + i * 0.6)) * 52;
            ctx.fillStyle = i % 2 === 0 ? currentColor : '#FF2A54';
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 14;
            drawRoundedRectPath(ctx, startX + i * barW, centerY + baseEyeH * 0.86 - bh, barW - 6, bh, 4);
            ctx.fill();
        }
        ctx.restore();
    }

    if (currentState === 'weather') {
        ctx.save();
        ctx.translate(centerX, centerY - baseEyeH * 0.78);
        if (weatherMode === 'storm') {
            ctx.fillStyle = '#00F2FE';
            ctx.shadowColor = '#00F2FE';
            ctx.shadowBlur = 22;
            drawRoundedRectPath(ctx, -65, -14, 130, 36, 18);
            ctx.fill();
            if (Math.sin(globalTime * 15) > 0.2) {
                ctx.fillStyle = '#FACC15';
                ctx.beginPath();
                ctx.moveTo(-6, 22);
                ctx.lineTo(-20, 48);
                ctx.lineTo(0, 48);
                ctx.lineTo(-12, 74);
                ctx.lineTo(20, 40);
                ctx.lineTo(2, 40);
                ctx.closePath();
                ctx.fill();
            }
        } else {
            ctx.fillStyle = '#FACC15';
            ctx.shadowColor = '#FACC15';
            ctx.shadowBlur = 28;
            ctx.beginPath();
            ctx.arc(0, 0, 32, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    if (currentState === 'scan') {
        const scanY = centerY + Math.sin(globalTime * 3.8) * (baseEyeH * 0.9);
        ctx.save();
        ctx.strokeStyle = '#34D399';
        ctx.shadowColor = '#34D399';
        ctx.shadowBlur = 24;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(centerX - eyeSpan * 1.8, scanY);
        ctx.lineTo(centerX + eyeSpan * 1.8, scanY);
        ctx.stroke();
        ctx.restore();
    }

    if (currentState === 'charge') {
        const level = (Math.sin(globalTime * 2) * 0.5 + 0.5) * 100;
        ctx.save();
        ctx.fillStyle = '#34D399';
        ctx.shadowColor = '#34D399';
        ctx.shadowBlur = 18;
        ctx.font = 'bold 18px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`⚡ BATTERY CHARGING: ${Math.round(level)}%`, centerX, centerY + baseEyeH * 0.82);
        ctx.restore();
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.015;
        if (p.alpha <= 0) {
            particles.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        if (p.type === 'tear') {
            ctx.fillStyle = '#00F2FE';
            ctx.shadowColor = '#00F2FE';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 'heart') {
            ctx.fillStyle = '#FF2A54';
            ctx.shadowColor = '#FF2A54';
            ctx.shadowBlur = 14;
            drawHeartShape(ctx, p.x, p.y, p.size);
        } else if (p.type === 'ember') {
            ctx.fillStyle = Math.random() > 0.5 ? '#FF2A54' : '#FB923C';
            ctx.shadowColor = '#FF2A54';
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 'zzz') {
            ctx.fillStyle = currentColor;
            ctx.font = `bold ${Math.round(p.size)}px "JetBrains Mono", monospace`;
            ctx.fillText('Zzz', p.x, p.y);
        } else if (p.type === 'bubble') {
            ctx.strokeStyle = '#00F2FE';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }
}

function animate(now) {
    if (typeof updateAutonomousLife === 'function') updateAutonomousLife(now);
    globalTime += 0.016;
    stateTimer += 0.016;
    if (activeHologram && activeHologram.timer > 0) {
        activeHologram.timer = Math.max(0, activeHologram.timer - 0.016);
    }

    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);

    const bottomHud = document.getElementById('bottom-hud');
    const zenActive = bottomHud ? bottomHud.classList.contains('opacity-0') : false;
    const centerX = w / 2;
    const centerY = zenActive ? (h * 0.5) : (h * 0.45);

    const baseEyeW = Math.min(w * 0.21, h * 0.29, 225);
    const baseEyeH = baseEyeW * 1.24;
    const eyeSpan = baseEyeW * 0.88;

    updateEyeSprings(now, baseEyeW, baseEyeH);

    let activeEyeColor = currentColor;
    if (currentState === 'angry' || currentState === 'demon') {
        activeEyeColor = Math.sin(globalTime * 18) > -0.2 ? '#FF2A54' : currentColor;
    } else if (currentState === 'charge') {
        activeEyeColor = '#34D399';
    }

    if (currentState === 'glitch' && Math.random() < 0.65) {
        ctx.save();
        ctx.globalAlpha = 0.7;
        drawVectorEye(leftEye, true, centerX - eyeSpan - 12, centerY, baseEyeW, baseEyeH, '#FF2A54');
        drawVectorEye(rightEye, false, centerX + eyeSpan + 12, centerY, baseEyeW, baseEyeH, '#00F2FE');
        ctx.restore();
    }

    drawVectorEye(leftEye, true, centerX - eyeSpan, centerY, baseEyeW, baseEyeH, activeEyeColor);
    drawVectorEye(rightEye, false, centerX + eyeSpan, centerY, baseEyeW, baseEyeH, activeEyeColor);

    drawStoryOverlays(w, h, centerX, centerY, eyeSpan, baseEyeW, baseEyeH);

    requestAnimationFrame(animate);
}
