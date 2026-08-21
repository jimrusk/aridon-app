export type TargetRange={min:number;max:number;unit:string;label:string};
export type GreenhouseTargetProfile=Record<string,TargetRange>;
export type GreenhouseAlert={level:'warning'|'critical';parameter:string;message:string};

const range=(label:string,min:number,max:number,unit:string):TargetRange=>({label,min,max,unit});

export const GREENHOUSE_TARGET_PRESETS:Record<string,GreenhouseTargetProfile>={
  generic:{
    air_temp_f:range('Air temperature',62,82,'°F'),humidity_pct:range('Relative humidity',50,80,'%'),vpd_kpa:range('VPD',0.5,1.3,'kPa'),co2_ppm:range('CO₂',400,1200,'ppm'),ppfd_umol_m2_s:range('PPFD',150,700,'µmol/m²/s'),dli_mol_m2_day:range('DLI',12,28,'mol/m²/day'),root_zone_temp_f:range('Root-zone temperature',60,76,'°F'),substrate_moisture_pct:range('Substrate moisture',40,80,'%'),ph:range('pH',5.5,6.8,''),ec_ms_cm:range('EC',1.2,3.2,'mS/cm')
  },
  tomato:{
    air_temp_f:range('Air temperature',68,82,'°F'),humidity_pct:range('Relative humidity',60,80,'%'),vpd_kpa:range('VPD',0.6,1.2,'kPa'),co2_ppm:range('CO₂',400,1200,'ppm'),ppfd_umol_m2_s:range('PPFD',350,800,'µmol/m²/s'),dli_mol_m2_day:range('DLI',20,30,'mol/m²/day'),root_zone_temp_f:range('Root-zone temperature',65,75,'°F'),substrate_moisture_pct:range('Substrate moisture',45,75,'%'),ph:range('pH',5.5,6.5,''),ec_ms_cm:range('EC',2.0,4.0,'mS/cm')
  },
  lettuce:{
    air_temp_f:range('Air temperature',58,72,'°F'),humidity_pct:range('Relative humidity',50,75,'%'),vpd_kpa:range('VPD',0.4,0.9,'kPa'),co2_ppm:range('CO₂',400,1000,'ppm'),ppfd_umol_m2_s:range('PPFD',150,350,'µmol/m²/s'),dli_mol_m2_day:range('DLI',12,18,'mol/m²/day'),root_zone_temp_f:range('Root-zone temperature',60,70,'°F'),substrate_moisture_pct:range('Substrate moisture',55,80,'%'),ph:range('pH',5.5,6.5,''),ec_ms_cm:range('EC',1.2,2.0,'mS/cm')
  },
  pepper:{
    air_temp_f:range('Air temperature',68,82,'°F'),humidity_pct:range('Relative humidity',55,75,'%'),vpd_kpa:range('VPD',0.7,1.3,'kPa'),co2_ppm:range('CO₂',400,1200,'ppm'),ppfd_umol_m2_s:range('PPFD',300,700,'µmol/m²/s'),dli_mol_m2_day:range('DLI',18,26,'mol/m²/day'),root_zone_temp_f:range('Root-zone temperature',65,76,'°F'),substrate_moisture_pct:range('Substrate moisture',45,75,'%'),ph:range('pH',5.5,6.5,''),ec_ms_cm:range('EC',1.8,2.8,'mS/cm')
  },
  cucumber:{
    air_temp_f:range('Air temperature',70,84,'°F'),humidity_pct:range('Relative humidity',65,85,'%'),vpd_kpa:range('VPD',0.5,1.1,'kPa'),co2_ppm:range('CO₂',400,1200,'ppm'),ppfd_umol_m2_s:range('PPFD',300,700,'µmol/m²/s'),dli_mol_m2_day:range('DLI',18,26,'mol/m²/day'),root_zone_temp_f:range('Root-zone temperature',66,76,'°F'),substrate_moisture_pct:range('Substrate moisture',50,80,'%'),ph:range('pH',5.5,6.5,''),ec_ms_cm:range('EC',1.7,2.7,'mS/cm')
  },
  strawberry:{
    air_temp_f:range('Air temperature',60,75,'°F'),humidity_pct:range('Relative humidity',60,75,'%'),vpd_kpa:range('VPD',0.6,1.1,'kPa'),co2_ppm:range('CO₂',400,1000,'ppm'),ppfd_umol_m2_s:range('PPFD',200,500,'µmol/m²/s'),dli_mol_m2_day:range('DLI',14,22,'mol/m²/day'),root_zone_temp_f:range('Root-zone temperature',58,70,'°F'),substrate_moisture_pct:range('Substrate moisture',50,75,'%'),ph:range('pH',5.5,6.5,''),ec_ms_cm:range('EC',1.2,2.0,'mS/cm')
  },
  herbs:{
    air_temp_f:range('Air temperature',62,78,'°F'),humidity_pct:range('Relative humidity',50,75,'%'),vpd_kpa:range('VPD',0.5,1.1,'kPa'),co2_ppm:range('CO₂',400,1000,'ppm'),ppfd_umol_m2_s:range('PPFD',150,450,'µmol/m²/s'),dli_mol_m2_day:range('DLI',12,20,'mol/m²/day'),root_zone_temp_f:range('Root-zone temperature',60,72,'°F'),substrate_moisture_pct:range('Substrate moisture',45,75,'%'),ph:range('pH',5.5,6.5,''),ec_ms_cm:range('EC',1.0,2.2,'mS/cm')
  }
};

export function getTargetProfile(crop:string):GreenhouseTargetProfile{
  const value=(crop||'').toLowerCase();
  if(value.includes('tomato'))return GREENHOUSE_TARGET_PRESETS.tomato;
  if(value.includes('lettuce')||value.includes('greens'))return GREENHOUSE_TARGET_PRESETS.lettuce;
  if(value.includes('pepper'))return GREENHOUSE_TARGET_PRESETS.pepper;
  if(value.includes('cucumber'))return GREENHOUSE_TARGET_PRESETS.cucumber;
  if(value.includes('strawber'))return GREENHOUSE_TARGET_PRESETS.strawberry;
  if(value.includes('basil')||value.includes('herb')||value.includes('cilantro')||value.includes('mint'))return GREENHOUSE_TARGET_PRESETS.herbs;
  return GREENHOUSE_TARGET_PRESETS.generic;
}

export function calculateVpdKpa(tempF:number,humidityPct:number){
  const c=(tempF-32)*5/9;
  const saturation=0.6108*Math.exp((17.27*c)/(c+237.3));
  return Math.max(0,Math.round((saturation*(1-Math.min(100,Math.max(0,humidityPct))/100))*100)/100);
}

export function evaluateReading(reading:Record<string,unknown>|null|undefined,target:GreenhouseTargetProfile):GreenhouseAlert[]{
  if(!reading)return[];
  const alerts:GreenhouseAlert[]=[];
  for(const [key,limits] of Object.entries(target||{})){
    const raw=reading[key];
    if(raw===null||raw===undefined||raw==='')continue;
    const value=Number(raw);
    if(!Number.isFinite(value)||value>=limits.min&&value<=limits.max)continue;
    const span=Math.max(0.01,limits.max-limits.min);
    const distance=value<limits.min?limits.min-value:value-limits.max;
    const level:GreenhouseAlert['level']=distance/span>0.3?'critical':'warning';
    const direction=value<limits.min?'below':'above';
    alerts.push({level,parameter:key,message:`${limits.label} ${value}${limits.unit} is ${direction} the ${limits.min}–${limits.max}${limits.unit} target.`});
  }
  return alerts;
}

export function greenhouseHealthScore(alerts:GreenhouseAlert[],readingAgeHours:number|null){
  let score=100;
  for(const alert of alerts)score-=alert.level==='critical'?18:8;
  if(readingAgeHours===null)score-=25;
  else if(readingAgeHours>24)score-=20;
  else if(readingAgeHours>12)score-=10;
  return Math.max(0,Math.min(100,Math.round(score)));
}
