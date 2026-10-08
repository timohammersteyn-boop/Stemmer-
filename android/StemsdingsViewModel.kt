package com.stemsdings.app.ui

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
    val showSpectralGraphs: Boolean = true,
    val zenModeEnabled: Boolean = false
)

data class StemState(
    val id: String,
    val name: String,
    val volume: Float = 0.8f,
    val isMuted: Boolean = false,
    val isSolo: Boolean = false,
    val isPlaying: Boolean = true,
    val currentBar: Int = 4,
    val activeDevice: S4Device = S4Device.MATERIAL
)

class StemsdingsViewModel : ViewModel() {

    // Globale Zustände
    val appMode = MutableStateFlow(AppMode.LIVE)
    val selectedDevice = MutableStateFlow(S4Device.MATERIAL)
    val uiConfig = MutableStateFlow(LiveUiConfig())
    val masterBpm = MutableStateFlow(128.0f)
    val crossfaderPosition = MutableStateFlow(0.5f) // 0.0 = Zone A, 1.0 = Zone B

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
    // 1. MATERIAL
    val tapeSpeed = MutableStateFlow(1.0f) // -2.0f to +2.0f
    val tapeReverse = MutableStateFlow(false)
    val loopLengthBars = MutableStateFlow(4) // 1, 2, 4, 8, 16
    val tapeCrossfade = MutableStateFlow(0.15f)

    // 2. GRANULAR
    val grainSize = MutableStateFlow(0.25f)
    val grainDensity = MutableStateFlow(0.5f)
    val granularSpray = MutableStateFlow(0.2f)
    val warpContour = MutableStateFlow(0.4f)

    // 3. FILTER
    val filterCutoff = MutableStateFlow(0.7f)
    val filterResonance = MutableStateFlow(0.35f)
    val filterMode = MutableStateFlow("LOWPASS") // LOWPASS, HIGHPASS, BANDPASS, NOTCH

    // 4. COLOR
    val colorDrive = MutableStateFlow(0.2f)
    val bitDepth = MutableStateFlow(16) // 4 to 16 bits
    val sampleRateCrush = MutableStateFlow(0.0f)
    val analogNoise = MutableStateFlow(0.05f)

    // 5. SPACE
    val delayTimeDivision = MutableStateFlow("1/4")
    val delayFeedback = MutableStateFlow(0.4f)
    val reverbRoomSize = MutableStateFlow(0.6f)
    val masterFreeze = MutableStateFlow(false)

    // Modulation Matrix Values (Live LFO Engine)
    val lfo1Value = MutableStateFlow(0.0f) // Slot 1: ▲ Cyan
    val lfo2Value = MutableStateFlow(0.0f) // Slot 2: ■ Yellow
    val seqStepValue = MutableStateFlow(0.0f) // Slot 3: ⬡ Green
    val macroValue = MutableStateFlow(0.5f) // Slot 4: ● Red

    // Reaktive HUD State & Timer (2000ms Auto-Dismiss)
    private val _hudMessage = MutableStateFlow<String?>(null)
    val hudMessage: StateFlow<String?> = _hudMessage.asStateFlow()
    private val _showCutoffHud = MutableStateFlow(false)
    val showCutoffHud: StateFlow<Boolean> = _showCutoffHud.asStateFlow()
    private var hudTimerJob: Job? = null

    init {
        startModulationEngine()
    }

    private fun startModulationEngine() {
        viewModelScope.launch {
            var phase = 0.0
            while (isActive) {
                phase += 0.05
                val bpmFactor = (masterBpm.value / 120.0f)
                lfo1Value.value = sin(phase * bpmFactor).toFloat()
                lfo2Value.value = sin(phase * 0.5 * bpmFactor).toFloat()
                seqStepValue.value = ((phase.toInt() % 16) / 16.0f)
                delay(16) // ~60 FPS
            }
        }
    }

    // Hardware Encoder / MIDI Change Handlers mit reaktivem 2000ms HUD
    fun triggerReactiveHud(paramName: String, valueText: String, slotSymbol: String = "▲") {
        _hudMessage.value = "$paramName: $valueText $slotSymbol"
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
            triggerReactiveHud("CUTOFF", "${(newValue * 100).toInt()}%", "▲")
        }
    }

    fun setGranularSprayFromMidi(newValue: Float) {
        granularSpray.value = newValue
        if (uiConfig.value.zenModeEnabled) {
            triggerReactiveHud("SPRAY", "${(newValue * 100).toInt()}%", "■")
        }
    }

    fun setTapeSpeed(speed: Float) {
        tapeSpeed.value = speed
        triggerReactiveHud("TAPE SPEED", "${(speed * 100).toInt()}%", "▲")
    }

    fun toggleMasterFreeze() {
        masterFreeze.value = !masterFreeze.value
        triggerReactiveHud("FREEZE", if (masterFreeze.value) "LOCKED" else "OFF", "●")
    }

    fun resetEncoderToDefault(device: S4Device, encoderIndex: Int) {
        when (device) {
            S4Device.MATERIAL -> when (encoderIndex) {
                0 -> tapeSpeed.value = 1.0f
                1 -> tapeReverse.value = false
                2 -> loopLengthBars.value = 4
                3 -> tapeCrossfade.value = 0.15f
            }
            S4Device.GRANULAR -> when (encoderIndex) {
                0 -> grainSize.value = 0.25f
                1 -> grainDensity.value = 0.5f
                2 -> granularSpray.value = 0.0f
                3 -> warpContour.value = 0.4f
            }
            S4Device.FILTER -> when (encoderIndex) {
                0 -> filterCutoff.value = 0.7f
                1 -> filterResonance.value = 0.3f
            }
            S4Device.COLOR -> when (encoderIndex) {
                0 -> colorDrive.value = 0.0f
                1 -> bitDepth.value = 16
                2 -> sampleRateCrush.value = 0.0f
                3 -> analogNoise.value = 0.0f
            }
            S4Device.SPACE -> when (encoderIndex) {
                0 -> delayFeedback.value = 0.3f
                1 -> reverbRoomSize.value = 0.5f
                2 -> masterFreeze.value = false
            }
        }
        triggerReactiveHud("RESET", "DEFAULT [PUSH]")
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
}
