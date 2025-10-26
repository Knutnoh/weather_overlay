
'''weather_overlay integration init'''
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
import logging

_LOGGER = logging.getLogger(__name__)
DOMAIN = "weather_overlay"

async def async_setup(hass: HomeAssistant, config: dict):
    """Set up the Weather Overlay integration.

    - Ensure an input_boolean.dashboardanimation exists (create registry entry + initial state)
    - Nothing else; frontend assets are provided in `frontend/` and should be loaded by HACS or added as a resource.
    """
    try:
        # Create entity registry entry if missing
        if hass.states.get('input_boolean.dashboardanimation') is None:
            registry = er.async_get(hass)
            # unique_id should be unique across HA
            registry.async_get_or_create(
                domain='input_boolean',
                platform='weather_overlay',
                unique_id='weather_overlay_dashboardanimation',
                suggested_object_id='dashboardanimation'
            )
            # set initial state to off with friendly_name
            hass.states.async_set('input_boolean.dashboardanimation', 'off',
                                  {'friendly_name': 'Dashboard Animation'})
            _LOGGER.info('Created input_boolean.dashboardanimation (initially off)')
    except Exception as e:
        _LOGGER.exception('Fehler beim Anlegen der input_boolean.dashboardanimation: %s', e)

    _LOGGER.info('Weather Overlay integration ready')
    return True
