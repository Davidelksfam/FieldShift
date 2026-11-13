"""Optional numerical cross-check: pip install pyet==1.3.1 pandas.
Uses independent pyet FAO-56 implementation; not independent field measurements.
"""
from pathlib import Path
import json,subprocess,math
import pandas as pd
import numpy as np
import pyet
ROOT=Path(__file__).resolve().parents[2]
code="""import d from './src/data/referenceEtDrivers.json' with {type:'json'};import {dailyReferenceEt} from './src/engine/referenceEt.js';console.log(JSON.stringify(Object.fromEntries(Object.entries(d).map(([id,p])=>[id,p.daily.map(r=>dailyReferenceEt(r,p.lat,p.elevationM))]))));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT))
data=json.loads((ROOT/'src/data/referenceEtDrivers.json').read_text());report={}
for key,d in data.items():
 frame=pd.DataFrame(d['daily']).set_index('date');frame.index=pd.DatetimeIndex(frame.index)
 expected=pyet.pm_fao56((frame.tmax+frame.tmin)/2,frame.wind,rs=frame.solar,tmax=frame.tmax,tmin=frame.tmin,rh=frame.rh,pressure=frame.pressure,elevation=d['elevationM'],lat=d['lat']*math.pi/180)
 error=np.abs(expected.to_numpy()-np.array(actual[key]))
 if error.max()>1e-6:raise ValueError(f'ET0 numerical mismatch: {key}')
 report[key]={'maxDailyDifferenceMm':float(error.max()),'meanDifferenceMm':float(error.mean()),'pyetAnnualMm':float(expected.sum()),'ourAnnualMm':sum(actual[key]),'samples':[{'date':frame.index[i].date().isoformat(),'expectedPyet':float(expected.iloc[i])} for i in [0,100,180,300]]}
(ROOT/'data/processed/reference-et-validation.json').write_text(json.dumps({'reference':f'pyet {pyet.__version__} pm_fao56','scope':'Independent numerical implementation comparison, not field validation. Same input data and mean RH approximation.','regions':report},indent=2)+'\n')
print('PASS: 1,095 daily FAO-56 values agree with pyet within 0.000001 mm/day')
