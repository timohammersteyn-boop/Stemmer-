package com.stemsdings.app.ui

import android.media.midi.MidiReceiver

/**
 * STEMSDINGS — Plug-and-Play USB MIDI Engine for Native Instruments & DIY Controllers
 * Listens for hardware encoders, buttons, and custom MIDI CC mappings.
 */
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
        val data1 = msg[offset + 1].toInt() and 0xFF
        val data2 = msg[offset + 2].toInt() and 0xFF

        // Check for Control Change Event (0xB0 .. 0xBF)
        if ((status and 0xF0) == 0xB0) {
            val normalized = data2 / 127f

            when (data1) {
                16 -> viewModel.setFilterCutoffFromMidi(normalized)
                17 -> viewModel.granularSpray.value = normalized
                18 -> viewModel.tapeSpeed.value = (normalized * 4.0f) - 2.0f // -2x to +2x
                19 -> viewModel.colorDrive.value = normalized
                20 -> viewModel.delayFeedback.value = normalized
                21 -> viewModel.reverbRoomSize.value = normalized
                22 -> viewModel.crossfaderPosition.value = normalized
                23 -> viewModel.masterBpm.value = 60f + (normalized * 120f)
            }
        }

        // Note On (Push Encoders or Pad buttons)
        if ((status and 0xF0) == 0x90 && data2 > 0) {
            when (data1) {
                36 -> viewModel.toggleMasterFreeze()
                40 -> viewModel.resetEncoderToDefault(viewModel.selectedDevice.value, 0)
                41 -> viewModel.resetEncoderToDefault(viewModel.selectedDevice.value, 1)
                42 -> viewModel.resetEncoderToDefault(viewModel.selectedDevice.value, 2)
            }
        }
    }
}
