import React, { useState } from 'react';
import { X, Code, Copy, Check, Download, Smartphone } from 'lucide-react';

interface AndroidCodeHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidCodeHubModal: React.FC<AndroidCodeHubModalProps> = ({ isOpen, onClose }) => {
  const [activeFile, setActiveFile] = useState<string>('StemsdingsViewModel.kt');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const CODE_FILES: Record<string, string> = {
    'StemsdingsViewModel.kt': `package com.stemsdings.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlin.math.sin

/**
 * STEMSDINGS — PLAY MUSIC DIFFERENT.
 * Torso Electronics S4 Architecture ViewModel for Android (Jetpack Compose)
 */

enum class AppMode { STUDIO, LIVE }
enum class S4Device { MATERIAL, GRANULAR, FILTER, COLOR, SPACE }
enum class ModSlot(val symbol: String, val colorHex: Long) {
    SLOT_1("▲", 0xFF00E5FF), // Cyan
    SLOT_2("■", 0xFFFFEA00), // Yellow
    SLOT_3("⬡", 0xFF00E676), // Green
    SLOT_4("●", 0xFFFF1744)  // Red
}

data class LiveUiConfig(
    val showMiniWaveforms: Boolean = true,
    val showEqDetails: Boolean = false,
    val showLiveModulations: Boolean = true,
    val zenModeEnabled: Boolean = false
)

data class StemState(
    val id: String,
    val name: String,
    val volume: Float = 0.8f,
    val isMuted: Boolean = false,
    val isSolo: Boolean = false,
    val currentBar: Int = 4
)

class StemsdingsViewModel : ViewModel() {

    // Globale Zustände
    val appMode = MutableStateFlow(AppMode.LIVE)
    val selectedDevice = MutableStateFlow(S4Device.MATERIAL)
    val uiConfig = MutableStateFlow(LiveUiConfig())
    val masterBpm = MutableStateFlow(128.0f)
    val crossfaderPosition = MutableStateFlow(0.5f)

    // 8 Stems (Zone A: 4 Stems links, Zone B: 4 Stems rechts)
    val stemsZoneA = MutableStateFlow(
        listOf(
            StemState("a_drums", "A.DRUMS", 0.85f),
            StemState("a_bass", "A.BASS", 0.78f),
            StemState("a_music", "A.SYNTH", 0.70f),
            StemState("a_vocal", "A.VOCAL", 0.65f)
        )
    )

    val stemsZoneB = MutableStateFlow(
        listOf(
            StemState("b_drums", "B.DRUMS", 0.80f),
            StemState("b_bass", "B.BASS", 0.75f),
            StemState("b_music", "B.LEAD", 0.68f),
            StemState("b_vocal", "B.ACAPELLA", 0.60f)
        )
    )

    // S4 5-Stage Parameter
    val tapeSpeed = MutableStateFlow(1.0f)
    val granularSpray = MutableStateFlow(0.2f)
    val filterCutoff = MutableStateFlow(0.7f)
    val filterResonance = MutableStateFlow(0.35f)
    val colorDrive = MutableStateFlow(0.2f)
    val delayFeedback = MutableStateFlow(0.4f)
    val masterFreeze = MutableStateFlow(false)

    // Modulations-Matrix LFO Engine (60 FPS)
    val lfo1Value = MutableStateFlow(0.0f) // Slot 1: ▲ Cyan
    val lfo2Value = MutableStateFlow(0.0f) // Slot 2: ■ Yellow

    // Reaktive HUD State & Timer (2000ms Auto-Dismiss)
    private val _hudMessage = MutableStateFlow<String?>(null)
    val hudMessage: StateFlow<String?> = _hudMessage.asStateFlow()
    private val _showCutoffHud = MutableStateFlow(false)
    val showCutoffHud: StateFlow<Boolean> = _showCutoffHud.asStateFlow()
    private var hudTimerJob: Job? = null

    init {
        viewModelScope.launch {
            var phase = 0.0
            while (isActive) {
                phase += 0.05
                lfo1Value.value = sin(phase).toFloat()
                delay(16)
            }
        }
    }

    fun triggerReactiveHud(paramName: String, valueText: String, symbol: String = "▲") {
        _hudMessage.value = "$paramName: $valueText $symbol"
        _showCutoffHud.value = true
        hudTimerJob?.cancel()
        hudTimerJob = viewModelScope.launch {
            delay(2000)
            _showCutoffHud.value = false
            _hudMessage.value = null
        }
    }

    fun setFilterCutoffFromMidi(newValue: Float) {
        filterCutoff.value = newValue
        if (uiConfig.value.zenModeEnabled || !uiConfig.value.showEqDetails) {
            triggerReactiveHud("CUTOFF", "\${(newValue * 100).toInt()}%", "▲")
        }
    }

    // Clock tracking for External MIDI Clock Sync
    private var lastClockTime = 0L
    private val clockTicks = mutableListOf<Long>()
    val extClockSyncEnabled = MutableStateFlow(false)

    fun handleMidiClockTick() {
        val now = System.currentTimeMillis()
        if (lastClockTime > 0) {
            val delta = now - lastClockTime
            if (delta in 9..89) {
                clockTicks.add(delta)
                if (clockTicks.size > 24) {
                    clockTicks.removeAt(0)
                }
                if (clockTicks.size >= 8) {
                    val avgDelta = clockTicks.average()
                    val calculatedBpm = 60000.0 / (avgDelta * 24.0)
                    if (calculatedBpm in 60.0..220.0 && extClockSyncEnabled.value) {
                        masterBpm.value = calculatedBpm.toFloat()
                    }
                }
            }
        }
        lastClockTime = now
    }

    fun handleMidiClockStart() {
        triggerReactiveHud("EXT CLOCK", "START", "▲")
    }

    fun handleMidiClockStop() {
        triggerReactiveHud("EXT CLOCK", "STOP", "●")
    }
}`,
    'StemsdingsMidiReceiver.kt': `package com.stemsdings.app.ui

import android.media.midi.MidiReceiver

class StemsdingsMidiReceiver(
    private val viewModel: StemsdingsViewModel
) : MidiReceiver() {

    override fun onSend(msg: ByteArray, offset: Int, count: Int, timestamp: Long) {
        if (count == 0) return

        val statusByte = msg[offset].toInt() and 0xFF

        // MIDI Real-time Messages: Clock Tick (0xF8), Start (0xFA), Stop (0xFC)
        if (statusByte == 0xF8) {
            viewModel.handleMidiClockTick()
            return
        }
        if (statusByte == 0xFA) {
            viewModel.handleMidiClockStart()
            return
        }
        if (statusByte == 0xFC) {
            viewModel.handleMidiClockStop()
            return
        }

        if (count < 3) return

        val status = msg[offset].toInt() and 0xFF
        val ccNumber = msg[offset + 1].toInt() and 0xFF
        val ccValue = msg[offset + 2].toInt() and 0xFF

        // Check for Control Change Event (0xB0 .. 0xBF)
        if ((status and 0xF0) == 0xB0) {
            val normalized = ccValue / 127f

            when (ccNumber) {
                16 -> viewModel.setFilterCutoffFromMidi(normalized)
                17 -> viewModel.granularSpray.value = normalized
                18 -> viewModel.tapeSpeed.value = (normalized * 4.0f) - 2.0f
                19 -> viewModel.colorDrive.value = normalized
                20 -> viewModel.delayFeedback.value = normalized
                21 -> viewModel.crossfaderPosition.value = normalized
            }
        }

        // Note On (Push Encoders to reset to default)
        if ((status and 0xF0) == 0x90 && ccValue > 0) {
            when (ccNumber) {
                36 -> viewModel.masterFreeze.value = !viewModel.masterFreeze.value
                40 -> viewModel.filterCutoff.value = 0.7f
            }
        }
    }
}`,
    'StemsdingsUi.kt': `package com.stemsdings.app.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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
    val hudMessage by viewModel.hudMessage.collectAsState()
    val showHud by viewModel.showCutoffHud.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ColorBlack)
            .padding(8.dp)
    ) {
        // TOP CHASSIS BAR: Brand + Modus-Umschalter
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
                    text = "PLAY MUSIC DIFFERENT.",
                    color = ColorLightGrey,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 9.sp
                )
            }

            // Mode Selector: STUDIO vs. LIVE
            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                ModeBadge("THE LAB (STUDIO)", mode == AppMode.STUDIO) {
                    viewModel.appMode.value = AppMode.STUDIO
                }
                ModeBadge("PERFORMANCE (LIVE)", mode == AppMode.LIVE) {
                    viewModel.appMode.value = AppMode.LIVE
                }
            }
        }

        // 8-STEM LIVE PERFORMANCE MATRIX
        Row(modifier = Modifier.fillMaxWidth().weight(1f)) {
            // Zone A
            StemZoneColumn("ZONE A [LEFT]", viewModel.stemsZoneA.collectAsState().value, Modifier.weight(1f))
            Spacer(modifier = Modifier.width(6.dp))
            // Zone B
            StemZoneColumn("ZONE B [RIGHT]", viewModel.stemsZoneB.collectAsState().value, Modifier.weight(1f))
        }

        // REAKTIVES POP-UP HUD OVERLAY (2000ms Auto-Dismiss)
        AnimatedVisibility(
            visible = showHud && hudMessage != null,
            enter = fadeIn(),
            exit = fadeOut()
        ) {
            Box(
                modifier = Modifier
                    .background(ColorBlack)
                    .border(1.dp, ColorModCyan)
                    .padding(horizontal = 12.dp, vertical = 6.dp)
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
}`,
    'TorsoS4AudioEngine.kt': `package com.stemsdings.app.audio

import android.content.Context
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer

/**
 * STEMSDINGS — Jetpack Media3 (ExoPlayer) Sample-Accurate 8-Stem Synchronizer
 */
class TorsoS4AudioEngine(private val context: Context) {
    private val players = mutableMapOf<String, ExoPlayer>()
    private var masterBpm = 128.0f

    fun initializeStem(stemId: String, audioUri: String) {
        val player = ExoPlayer.Builder(context).build().apply {
            setMediaItem(MediaItem.fromUri(audioUri))
            repeatMode = Player.REPEAT_MODE_ONE
            prepare()
        }
        players[stemId] = player
    }

    fun startSynchronousPlayback() {
        players.values.forEach {
            it.seekTo(0)
            it.play()
        }
    }

    fun setMasterBpm(bpm: Float) {
        masterBpm = bpm
        val speedMultiplier = masterBpm / 128.0f
        players.values.forEach { it.setPlaybackSpeed(speedMultiplier) }
    }
}`,
    'MainActivity.kt': `package com.stemsdings.app

import android.content.Context
import android.media.midi.MidiManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import com.stemsdings.app.ui.StemsdingsMidiReceiver
import com.stemsdings.app.ui.StemsdingsViewModel
import com.stemsdings.app.ui.StemsdingsWorkstation

class MainActivity : ComponentActivity() {
    private val viewModel: StemsdingsViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val receiver = StemsdingsMidiReceiver(viewModel)

        val midiManager = getSystemService(Context.MIDI_SERVICE) as? MidiManager
        midiManager?.devices?.firstOrNull()?.let { info ->
            midiManager.openDevice(info, { device ->
                device?.openOutputPort(0)?.connect(receiver)
            }, null)
        }

        setContent {
            StemsdingsWorkstation(viewModel = viewModel)
        }
    }
}`,
    'StemsdingsResponsiveRouter.kt': `package com.stemsdings.app.ui

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import android.content.res.Configuration

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun StemsdingsResponsiveRouter(viewModel: StemsdingsViewModel) {
    // 1. Orientierung des Geräts in Echtzeit auslesen
    val configuration = LocalConfiguration.current
    val isLandscape = configuration.orientation == Configuration.ORIENTATION_LANDSCAPE
    val appMode by viewModel.appMode.collectAsState()

    if (isLandscape) {
        // 🎛️ LANDSCAPE-MODUS: Volles 3-Spalten-Profi-Setup auf einem Screen
        StemsdingsWorkstation(viewModel = viewModel)
    } else {
        // 📱 PORTRAIT-MODUS: Vollbild-Seiten mit flüssiger Wischgeste (Swipe)
        val pageCount = 5
        val pagerState = rememberPagerState(pageCount = { pageCount })

        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(ColorBlack)
                .padding(12.dp)
        ) {
            // Minimalistischer Page-Indicator (Status-LED-Leiste im Torso-Style)
            PortraitHeaderIndicator(currentPage = pagerState.currentPage, pageCount = pageCount)
            
            Spacer(modifier = Modifier.height(8.dp))

            // Der HorizontalPager steuert die Wischgesten für die Haupt-Screens
            HorizontalPager(
                state = pagerState,
                modifier = Modifier
                    .fillMaxHeight()
                    .fillMaxWidth()
            ) { page ->
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .border(1.dp, ColorDarkGrey)
                        .background(ColorCharcoal)
                        .padding(16.dp)
                ) {
                    // Je nach Wisch-Position laden wir das entsprechende Modul
                    // Die Audio-Engine läuft im Hintergrund unverändert weiter!
                    when (page) {
                        0 -> PortraitScreenWrapper("// 01 // LIBRARY", "Hier Stems & Loops laden")
                        1 -> PortraitScreenWrapper("// 02 // PERFORMANCE PADS", "Deine 4x4 Pads")
                        2 -> PortraitScreenWrapper("// 03 // STEM AUDIO MIXER", "MIXER DECK A/B")
                        3 -> Column(modifier = Modifier.fillMaxSize()) {
                                Text("// 04 // S4 SOUND SCULPTING", color = ColorOffWhite, fontFamily = FontFamily.Monospace, fontSize = 12.sp)
                                Spacer(modifier = Modifier.height(16.dp))
                                Box(modifier = Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                                    Text("[ DIFFUSE DELAY CONCENTRIC VISUALIZER ]", color = ColorDarkGrey, fontFamily = FontFamily.Monospace, fontSize = 10.sp)
                                }
                             }
                        4 -> PortraitScreenWrapper("// 05 // SYSTEM SETTINGS", "MIDI Learn, Audio-Setup & Buffers")
                    }
                }
            }
        }
    }
}

@Composable
fun PortraitHeaderIndicator(currentPage: Int, pageCount: Int) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(32.dp)
            .border(1.dp, ColorDarkGrey)
            .background(ColorCharcoal)
            .padding(horizontal = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row {
            Text("STEMS", color = ColorOffWhite, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, fontSize = 12.sp)
            Text("dings", color = ColorLightGrey, fontSize = 12.sp)
        }

        // Taktile Punkte, die die aktive Seite als helle "Hardware-LED" anzeigen
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            for (i in 0 until pageCount) {
                val isActive = i == currentPage
                Box(
                    modifier = Modifier
                        .size(width = if(isActive) 16.dp else 6.dp, height = 6.dp)
                        .background(if (isActive) ColorCream else ColorDarkGrey)
                )
            }
        }
    }
}

@Composable
fun PortraitScreenWrapper(title: String, subtitle: String) {
    Column(modifier = Modifier.fillMaxSize()) {
        Text(text = title, color = ColorOffWhite, fontFamily = FontFamily.Monospace, fontSize = 13.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(8.dp))
        Text(text = subtitle, color = ColorLightGrey, fontSize = 11.sp)
        
        Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.Center) {
            Text("[ MINIMAL INDUSTRIAL INTERFACE ]", color = ColorDarkGrey, fontFamily = FontFamily.Monospace, fontSize = 10.sp)
        }
    }
}`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(CODE_FILES[activeFile] || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = CODE_FILES[activeFile] || '';
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 select-none font-mono">
      <div className="w-full max-w-4xl h-[85vh] bg-[#0B0B0C] border border-[#282A2E] p-4 flex flex-col gap-3 text-[#E4E7EB]">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#282A2E]">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#00E5FF]" />
            <span className="text-xs font-bold tracking-wider text-[#F9F6F0]">
              NATIVE ANDROID (KOTLIN + JETPACK COMPOSE) ARCHITECTURE
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#161719] border border-[#282A2E] text-[#8E9296] hover:text-[#E4E7EB]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* File Tabs & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1 bg-[#161719] border border-[#282A2E] p-0.5">
            {Object.keys(CODE_FILES).map((fileName) => (
              <button
                key={fileName}
                onClick={() => setActiveFile(fileName)}
                className={`px-2.5 py-1 text-[10px] font-bold transition-colors ${
                  activeFile === fileName
                    ? 'bg-[#E4E7EB] text-[#0B0B0C]'
                    : 'text-[#8E9296] hover:text-[#E4E7EB]'
                }`}
              >
                {fileName}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1 bg-[#161719] border border-[#282A2E] text-[10px] font-bold hover:text-[#E4E7EB]"
            >
              {copied ? <Check className="w-3 h-3 text-[#00E676]" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'COPIED!' : 'COPY CODE'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-3 py-1 bg-[#E4E7EB] text-[#0B0B0C] border border-[#E4E7EB] text-[10px] font-bold hover:bg-white"
            >
              <Download className="w-3 h-3" />
              <span>DOWNLOAD .KT</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto bg-[#161719] border border-[#282A2E] p-4 text-[11px] leading-relaxed text-[#E4E7EB] font-mono selection:bg-[#00E5FF] selection:text-[#0B0B0C]">
          <pre className="whitespace-pre">{CODE_FILES[activeFile]}</pre>
        </div>
      </div>
    </div>
  );
};
