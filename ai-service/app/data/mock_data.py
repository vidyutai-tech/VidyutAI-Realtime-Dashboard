# ems-backend/app/data/mock_data.py

from datetime import datetime, timedelta
import random
from app.models import pydantic_models as models
from app.core.security import get_password_hash

# --- Hardcoded User ---
MOCK_USER_DB = {
    "operator@vidhyut.ai": models.UserInDB(
        email="operator@vidhyut.ai",
        hashed_password=get_password_hash("password123"),
        disabled=False
    )
}

# --- Mock Data Store ---
MOCK_SITES = [
    models.Site(id="site_ahd_gj", name="Sabarmati Riverfront Solar", location="Ahmedabad, Gujarat", status="online"),
    models.Site(id="site_srt_gj", name="Surat Industrial Power Hub", location="Surat, Gujarat", status="online"),
    models.Site(id="site_gnr_gj", name="GIFT City Smart Grid", location="Gandhinagar, Gujarat", status="maintenance"),
]

MOCK_MAINTENANCE_ASSETS = [
    # Ahmedabad Solar Assets
    models.MaintenanceAsset(id="asset_ahd_inv01", siteId="site_ahd_gj", name="Inverter Unit SR-01", type="Inverter", modelNumber="Solis-255K-EHV", installDate="2022-08-10", status="degraded", failure_probability=0.35, rank=1),
    models.MaintenanceAsset(id="asset_ahd_pv01", siteId="site_ahd_gj", name="Rooftop PV Array 3B", type="PV Panel", modelNumber="Adani-AS-720W", installDate="2022-07-20", status="operational", failure_probability=0.12, rank=5),
    models.MaintenanceAsset(id="asset_ahd_bess01", siteId="site_ahd_gj", name="Grid Battery Bank A", type="BESS", modelNumber="Exide-Li-Ion-5MWh", installDate="2023-02-15", status="operational", failure_probability=0.08, rank=7),

    # Surat Industrial Hub Assets
    models.MaintenanceAsset(id="asset_srt_gt01", siteId="site_srt_gj", name="Gas Turbine Primary", type="Gas Turbine", modelNumber="Siemens-SGT-800", installDate="2019-05-22", status="operational", failure_probability=0.05, rank=8),
    models.MaintenanceAsset(id="asset_srt_trn01", siteId="site_srt_gj", name="Main Step-Down Transformer", type="Transformer", modelNumber="BHEL-TX-500", installDate="2019-01-05", status="offline", failure_probability=0.75, rank=0),
    models.MaintenanceAsset(id="asset_srt_motor01", siteId="site_srt_gj", name="Pumping Station Motor 5", type="Motor", modelNumber="Kirloskar-HV-Motor", installDate="2020-04-11", status="degraded", failure_probability=0.28, rank=2),

    # Gandhinagar Smart Grid Assets
    models.MaintenanceAsset(id="asset_gnr_evc01", siteId="site_gnr_gj", name="EV Charging Hub G-1", type="EV Charger", modelNumber="Tata-DC-Fast-50kW", installDate="2023-09-01", status="operational", failure_probability=0.02, rank=9),
    
    # FIX: Changed status from "maintenance" to "offline" for this asset
    models.MaintenanceAsset(id="asset_gnr_sm01", siteId="site_gnr_gj", name="Smart Meter Gateway T-1", type="Smart Meter", modelNumber="Genus-SM-Gateway", installDate="2021-11-01", status="offline", failure_probability=0.22, rank=3),
]

MOCK_ALERTS = {
    "site_ahd_gj": [
        models.Alert(id="alert_ahd_1", timestamp=datetime.utcnow() - timedelta(hours=2), device_id="asset_ahd_inv01", severity="critical", message="Inverter Over-temperature Fault", diagnosis="Cooling fan failure or extreme ambient temperature.", recommended_action="Initiate immediate shutdown of unit SR-01 and dispatch technician.", status="active"),
        models.Alert(id="alert_ahd_2", timestamp=datetime.utcnow() - timedelta(days=1), device_id="asset_ahd_pv01", severity="warning", message="Soiling Loss Exceeds 10%", diagnosis="High dust/pollen count affecting panel efficiency.", recommended_action="Schedule automated cleaning cycle for Rooftop Array 3B.", status="acknowledged"),
    ],
    "site_srt_gj": [
        models.Alert(id="alert_srt_1", timestamp=datetime.utcnow() - timedelta(minutes=30), device_id="asset_srt_gt01", severity="warning", message="Gas Turbine Efficiency Drop", diagnosis="Possible fuel nozzle blockage or filter degradation.", recommended_action="Schedule inspection during next low-demand period.", status="active"),
         models.Alert(id="alert_srt_2", timestamp=datetime.utcnow() - timedelta(days=3), device_id="asset_srt_motor01", severity="info", message="Motor Vibration Anomaly", diagnosis="Minor bearing wear detected by predictive model.", recommended_action="Schedule lubrication and inspection within 30 days.", status="resolved"),
    ],
    "site_gnr_gj": [
        models.Alert(id="alert_gnr_1", timestamp=datetime.utcnow() - timedelta(hours=6), device_id="asset_gnr_sm01", severity="info", message="Firmware Update in Progress", diagnosis="Scheduled maintenance for Smart Meter Gateway T-1.", recommended_action="Monitor update progress via admin panel.", status="acknowledged"),
    ]
}

MOCK_RL_SUGGESTIONS = {
    "site_ahd_gj": [
        models.RLSuggestion(
            id="rl_ahd_1",
            timestamp=datetime.utcnow(),
            action_summary="Sell BESS power to grid during evening peak",
            explanation=["Grid demand in Ahmedabad peaks between 6-9 PM.", "Solar generation is zero, making stored energy highly valuable.", "Action maximizes revenue from stored solar energy."],
            confidence=0.95,
            estimated_cost_savings=180000.00, # In INR (₹)
            status="pending",
            current_flows=models.EnergyFlows(grid_to_load=5, pv_to_load=0, pv_to_battery=0, battery_to_load=5, battery_to_grid=0, pv_to_grid=0),
            suggested_flows=models.EnergyFlows(grid_to_load=0, pv_to_load=0, pv_to_battery=0, battery_to_load=0, battery_to_grid=10, pv_to_grid=0)
        )
    ],
    "site_srt_gj": [
         models.RLSuggestion(
            id="rl_srt_1",
            timestamp=datetime.utcnow() - timedelta(minutes=10),
            action_summary="Curtail non-essential loads to avoid peak tariff",
            explanation=["Torrent Power price entering high-tariff block in 15 mins.", "Current load trend will trigger peak pricing.", "Shedding 1.5MW of non-critical load avoids significant cost."],
            confidence=0.89,
            estimated_cost_savings=95000.00, # In INR (₹)
            status="pending",
            current_flows=models.EnergyFlows(grid_to_load=5.5, pv_to_load=2.0, pv_to_battery=0.5, battery_to_load=0, battery_to_grid=0, pv_to_grid=0),
            suggested_flows=models.EnergyFlows(grid_to_load=4.0, pv_to_load=2.0, pv_to_battery=0.5, battery_to_load=0, battery_to_grid=0, pv_to_grid=0)
        )
    ]
}

LAST_SUGGESTION_ACTION = {}