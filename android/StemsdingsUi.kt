package com.stemsdings.app.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// Torso Industrial Hardware-Farbkonstanten
val ColorBlack = Color(0xFF0B0B0C)
val ColorCharcoal = Color(0xFF161719)
val ColorDarkGrey = Color(0xFF282A2E)
val ColorLightGrey = Color(0xFF8E9296)
val ColorOffWhite = Color(0xFFE4E7EB)
val ColorCream = Color(0xFFF9F6F0)

// Modulations-Farbmatrix (S4 Standard)
val ColorModCyan = Color(0xFF00E5FF)   // Slot 1: ▲
val ColorModYellow = Color(0xFFFFEA00) // Slot 2: ■
val ColorModGreen = Color(0xFF00E676)  // Slot 3: ⬡
val ColorModRed = Color(0xFFFF1744)    // Slot 4: ●

@Composable
fun StemsdingsWorkstation(viewModel: StemsdingsViewModel) {
    val mode by viewModel.appMode.collectAsState()
    val activeDevice by viewModel.selectedDevice.collectAsState()
    val bpm by viewModel.masterBpm.collectAsState()
    val config by viewModel.uiConfig.collectAsState()
    val hudMessage by viewModel.hudMessage.collectAsState()
    val showHud by viewModel.showCutoffHud.collectAsState()
    val lfoValue by viewModel.lfo1Value.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ColorBlack)
            .padding(8.dp)
    ) {
        // TOP CHASSIS BAR: Brand + Modus-Umschalter + Master BPM
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(ColorCharcoal)
                .border(1.dp, ColorDarkGrey)
                .padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text(
                    text = "STEMSDINGS",
                    color = ColorOffWhite,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
                Text(
                    text = "PLAY MUSIC DIFFERENT. // TORSO S4 ARCHITECTURE",
                    color = ColorLightGrey,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 9.sp
                )
            }

            // Mode Selector: STUDIO vs. LIVE
            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                ModeBadge(
                    label = "THE LAB (STUDIO)",
                    isActive = mode == AppMode.STUDIO,
                    onClick = { viewModel.appMode.value = AppMode.STUDIO }
                )
                ModeBadge(
                    label = "PERFORMANCE (LIVE)",
                    isActive = mode == AppMode.LIVE,
                    onClick = { viewModel.appMode.value = AppMode.LIVE }
                )
            }

            // Master BPM & Sync
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "${bpm.toInt()} BPM",
                    color = ColorCream,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp
                )
            }
        }

        Spacer(modifier = Modifier.height(6.dp))

        // 8-STEM LIVE REMIX ZONE (Set A links, Set B rechts)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            // Zone A: 4 Stems
            StemZoneColumn(
                zoneTitle = "ZONE A [LEFT]",
                stems = viewModel.stemsZoneA.collectAsState().value,
                modifier = Modifier.weight(1f)
            )

            // Zone B: 4 Stems
            StemZoneColumn(
                zoneTitle = "ZONE B [RIGHT]",
                stems = viewModel.stemsZoneB.collectAsState().value,
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(6.dp))

        // S4 MODULAR SOUND-SCULPTING RACK (5 Stages)
        S4SculptingRack(
            activeDevice = activeDevice,
            onSelectDevice = { viewModel.selectedDevice.value = it },
            viewModel = viewModel,
            lfoValue = lfoValue
        )

        // REAKTIVES POP-UP HUD OVERLAY (Wenn im Editor ausgeblendet, aber Hardware bewegt wird)
        AnimatedVisibility(
            visible = showHud && hudMessage != null,
            enter = fadeIn(),
            exit = fadeOut(),
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 4.dp)
        ) {
            Box(
                modifier = Modifier
                    .background(ColorBlack)
                    .border(1.dp, ColorModCyan)
                    .padding(horizontal = 12.dp, vertical = 6.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = hudMessage ?: "",
                    color = ColorModCyan,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    fontSize = 11.sp
                )
            }
        }
    }
}

@Composable
fun ModeBadge(label: String, isActive: Boolean, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .background(if (isActive) ColorOffWhite else ColorBlack)
            .border(1.dp, if (isActive) ColorOffWhite else ColorDarkGrey)
            .clickable { onClick() }
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Text(
            text = label,
            color = if (isActive) ColorBlack else ColorLightGrey,
            fontFamily = FontFamily.Monospace,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
fun StemZoneColumn(
    zoneTitle: String,
    stems: List<StemState>,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxHeight()
            .background(ColorCharcoal)
            .border(1.dp, ColorDarkGrey)
            .padding(6.dp)
    ) {
        Text(
            text = zoneTitle,
            color = ColorLightGrey,
            fontFamily = FontFamily.Monospace,
            fontSize = 10.sp,
            modifier = Modifier.padding(bottom = 4.dp)
        )

        Row(
            modifier = Modifier.fillMaxSize(),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            stems.forEach { stem ->
                StemChannelStrip(stem = stem, modifier = Modifier.weight(1f))
            }
        }
    }
}

@Composable
fun StemChannelStrip(
    stem: StemState,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxHeight()
            .background(ColorBlack)
            .border(0.5.dp, ColorDarkGrey)
            .padding(4.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = stem.name,
            color = ColorOffWhite,
            fontFamily = FontFamily.Monospace,
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.weight(1f))

        // Mini Fader representation
        Box(
            modifier = Modifier
                .width(16.dp)
                .fillMaxHeight(0.6f)
                .background(ColorDarkGrey)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .fillMaxHeight(stem.volume)
                    .align(Alignment.BottomCenter)
                    .background(ColorOffWhite)
            )
        }

        Spacer(modifier = Modifier.height(4.dp))

        Text(
            text = "${(stem.volume * 100).toInt()}%",
            color = ColorLightGrey,
            fontFamily = FontFamily.Monospace,
            fontSize = 8.sp
        )
    }
}

@Composable
fun S4SculptingRack(
    activeDevice: S4Device,
    onSelectDevice: (S4Device) -> Unit,
    viewModel: StemsdingsViewModel,
    lfoValue: Float
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(ColorCharcoal)
            .border(1.dp, ColorDarkGrey)
            .padding(8.dp)
    ) {
        // Device Tabs: 1. MATERIAL, 2. GRANULAR, 3. FILTER, 4. COLOR, 5. SPACE
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            S4Device.values().forEach { device ->
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .background(if (activeDevice == device) ColorDarkGrey else ColorBlack)
                        .border(1.dp, if (activeDevice == device) ColorOffWhite else ColorDarkGrey)
                        .clickable { onSelectDevice(device) }
                        .padding(vertical = 4.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = device.name,
                        color = if (activeDevice == device) ColorCream else ColorLightGrey,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // 9-Encoder Strip for the Selected Device
        HardwareEncodersPanel(device = activeDevice, viewModel = viewModel, lfo = lfoValue)
    }
}

@Composable
fun HardwareEncodersPanel(
    device: S4Device,
    viewModel: StemsdingsViewModel,
    lfo: Float
) {
    val cutoff by viewModel.filterCutoff.collectAsState()
    val spray by viewModel.granularSpray.collectAsState()
    val tapeSpeed by viewModel.tapeSpeed.collectAsState()

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(80.dp),
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        when (device) {
            S4Device.FILTER -> {
                EncoderCell("CUTOFF", cutoff, modSymbol = "▲", modColor = ColorModCyan, lfoOffset = lfo * 0.15f)
                EncoderCell("RESONANCE", viewModel.filterResonance.collectAsState().value)
                EncoderCell("SLOPE", 0.5f)
                EncoderCell("DRIVE", 0.2f)
            }
            S4Device.MATERIAL -> {
                EncoderCell("TAPE SPD", (tapeSpeed + 2f) / 4f, modSymbol = "▲", modColor = ColorModCyan)
                EncoderCell("X-FADE", viewModel.tapeCrossfade.collectAsState().value)
                EncoderCell("LOOP LEN", 0.5f)
                EncoderCell("WARP", 0.1f)
            }
            S4Device.GRANULAR -> {
                EncoderCell("GRAIN SZ", viewModel.grainSize.collectAsState().value)
                EncoderCell("DENSITY", viewModel.grainDensity.collectAsState().value)
                EncoderCell("SPRAY", spray, modSymbol = "■", modColor = ColorModYellow, lfoOffset = lfo * 0.1f)
                EncoderCell("CONTOUR", viewModel.warpContour.collectAsState().value)
            }
            S4Device.COLOR -> {
                EncoderCell("DRIVE", viewModel.colorDrive.collectAsState().value)
                EncoderCell("BIT CRUSH", 0.3f)
                EncoderCell("SR REDUCE", 0.1f)
                EncoderCell("NOISE", viewModel.analogNoise.collectAsState().value)
            }
            S4Device.SPACE -> {
                EncoderCell("DELAY FB", viewModel.delayFeedback.collectAsState().value)
                EncoderCell("ROOM SZ", viewModel.reverbRoomSize.collectAsState().value)
                EncoderCell("DAMPING", 0.4f)
                EncoderCell("FREEZE", if (viewModel.masterFreeze.collectAsState().value) 1f else 0f, modSymbol = "●", modColor = ColorModRed)
            }
        }
    }
}

@Composable
fun EncoderCell(
    label: String,
    value: Float,
    modSymbol: String? = null,
    modColor: Color = ColorOffWhite,
    lfoOffset: Float = 0f
) {
    Column(
        modifier = Modifier
            .width(68.dp)
            .fillMaxHeight()
            .background(ColorBlack)
            .border(0.5.dp, ColorDarkGrey)
            .padding(4.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            color = ColorLightGrey,
            fontFamily = FontFamily.Monospace,
            fontSize = 8.sp
        )

        // Circular Minimalist Encoder
        Canvas(modifier = Modifier.size(34.dp)) {
            val stroke = Stroke(width = 2.dp.toPx())
            drawCircle(color = ColorDarkGrey, style = stroke)

            // Modulated Arc
            val effectiveVal = (value + lfoOffset).coerceIn(0f, 1f)
            val angle = effectiveVal * 280f
            drawArc(
                color = if (modSymbol != null) modColor else ColorOffWhite,
                startAngle = 130f,
                sweepAngle = angle,
                useCenter = false,
                style = Stroke(width = 2.5.dp.toPx())
            )
        }

        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = "${(value * 100).toInt()}%",
                color = ColorOffWhite,
                fontFamily = FontFamily.Monospace,
                fontSize = 8.sp
            )
            if (modSymbol != null) {
                Text(
                    text = " $modSymbol",
                    color = modColor,
                    fontSize = 8.sp
                )
            }
        }
    }
}
