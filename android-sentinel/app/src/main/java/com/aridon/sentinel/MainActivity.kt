package com.aridon.sentinel
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
class MainActivity:ComponentActivity(){override fun onCreate(b:Bundle?){super.onCreate(b);setContent{SentinelApp(Scanner(this))}}}
@Composable fun SentinelApp(scanner:Scanner){
 var approved by remember{mutableStateOf(false)}; var report by remember{mutableStateOf<ScanReport?>(null)}
 MaterialTheme{Surface(Modifier.fillMaxSize()){Column(Modifier.padding(18.dp)){
  Text("Aridon Sentinel",style=MaterialTheme.typography.headlineMedium); Text("Mobile + Financial Defense"); Spacer(Modifier.height(12.dp))
  Text("Owner Full Scan checks installed apps, install sources, accessibility services, device administrators and exposed security settings. It does not bypass Android or read protected app data.")
  Row{Checkbox(approved,{approved=it});Text("I own/control this device and approve this scan.",Modifier.padding(top=12.dp))}
  Button(onClick={report=scanner.scan()},enabled=approved){Text("RUN OWNER FULL SCAN")}
  Row(horizontalArrangement=Arrangement.spacedBy(6.dp)){OutlinedButton(onClick={scanner.openUsageAccess()}){Text("Usage")};OutlinedButton(onClick={scanner.openNotificationAccess()}){Text("Alerts")};OutlinedButton(onClick={scanner.openAccessibility()}){Text("Accessibility")}}
  report?.let{r->Text("Findings: "+r.findings.size,Modifier.padding(top=12.dp));LazyColumn{items(r.findings){x->Card(Modifier.fillMaxWidth().padding(vertical=4.dp)){Column(Modifier.padding(10.dp)){Text(x.name+"  Risk "+x.risk+"/100");Text(x.detail);Text(x.kind)}}};items(r.blocked){x->Text("Android boundary: "+x,Modifier.padding(vertical=5.dp))}}}
 }}}
}