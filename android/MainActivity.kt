package com.stemsdings.app

import android.content.Context
import android.media.midi.MidiDevice
import android.media.midi.MidiDeviceInfo
import android.media.midi.MidiManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import com.stemsdings.app.ui.StemsdingsMidiReceiver
import com.stemsdings.app.ui.StemsdingsViewModel
import com.stemsdings.app.ui.StemsdingsWorkstation

/**
 * STEMSDINGS — PLAY MUSIC DIFFERENT.
 * Native Android Main Activity with auto-detect USB MIDI for NI Traktor & DIY Encoders
 */
class MainActivity : ComponentActivity() {

    private val viewModel: StemsdingsViewModel by viewModels()
    private var midiManager: MidiManager? = null
    private var midiReceiver: StemsdingsMidiReceiver? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        midiReceiver = StemsdingsMidiReceiver(viewModel)
        setupMidiHardwarePlugAndPlay()

        setContent {
            StemsdingsWorkstation(viewModel = viewModel)
        }
    }

    private fun setupMidiHardwarePlugAndPlay() {
        midiManager = getSystemService(Context.MIDI_SERVICE) as? MidiManager
        val manager = midiManager ?: return

        // Auto-detect currently connected USB MIDI devices
        val devices = manager.devices
        for (info in devices) {
            connectToMidiDevice(info)
        }

        // Auto-detect when new controller (NI Traktor X1 / Teensy) is plugged in via OTG
        manager.registerDeviceCallback(object : MidiManager.DeviceCallback() {
            override fun onDeviceAdded(device: MidiDeviceInfo) {
                Log.d("STEMSDINGS", "MIDI Controller detected: ${device.properties.getString(MidiDeviceInfo.PROPERTY_NAME)}")
                connectToMidiDevice(device)
            }

            override fun onDeviceRemoved(device: MidiDeviceInfo) {
                Log.d("STEMSDINGS", "MIDI Controller detached")
            }
        }, Handler(Looper.getMainLooper()))
    }

    private fun connectToMidiDevice(info: MidiDeviceInfo) {
        val manager = midiManager ?: return
        val receiver = midiReceiver ?: return

        manager.openDevice(info, { device: MidiDevice? ->
            if (device != null) {
                val outputPort = device.openOutputPort(0)
                outputPort?.connect(receiver)
                Log.d("STEMSDINGS", "Armed MIDI port 0 for ${info.properties.getString(MidiDeviceInfo.PROPERTY_NAME)}")
            }
        }, Handler(Looper.getMainLooper()))
    }
}
