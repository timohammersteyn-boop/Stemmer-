package com.stemsdings.app.ui

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

/**
 * STEMSDINGS — RESPONSIVE LAYOUT MATRIX & SWIPE-NAVIGATION (ZEN-VIEWPORT)
 * Automatically adapts between LANDSCAPE-FIRST stacked professional matrix (Tablets/Desktops)
 * and PORTRAIT-MODUS HorizontalPager swipe-navigation (Smartphones).
 */

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
}
