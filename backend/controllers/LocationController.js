class LocationController {
  // Placeholder for Location model (not yet created)
  
  // Get all locations
  async getAll(req, res) {
    try {
      // TODO: Implement with Location model
      const locations = [
        {
          id: 1,
          name: 'Head Office',
          address: 'Jakarta',
          latitude: -6.2088,
          longitude: 106.8456,
          radius: 100
        }
      ];

      res.json({
        success: true,
        data: locations
      });
    } catch (error) {
      console.error('Get all locations error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get locations'
      });
    }
  }

  // Create location
  async create(req, res) {
    try {
      const { name, address, latitude, longitude, radius } = req.body;

      if (!name || !latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: 'Name, latitude, and longitude are required'
        });
      }

      // TODO: Implement with Location model
      const location = {
        id: Date.now(),
        name,
        address,
        latitude,
        longitude,
        radius: radius || 100
      };

      res.status(201).json({
        success: true,
        message: 'Location created successfully',
        data: location
      });
    } catch (error) {
      console.error('Create location error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create location'
      });
    }
  }

  // Get location by ID
  async getById(req, res) {
    try {
      const { id } = req.params;

      // TODO: Implement with Location model
      const location = {
        id: parseInt(id),
        name: 'Head Office',
        address: 'Jakarta',
        latitude: -6.2088,
        longitude: 106.8456,
        radius: 100
      };

      res.json({
        success: true,
        data: location
      });
    } catch (error) {
      console.error('Get location error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get location'
      });
    }
  }

  // Update location
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, address, latitude, longitude, radius } = req.body;

      // TODO: Implement with Location model
      const location = {
        id: parseInt(id),
        name: name || 'Head Office',
        address: address || 'Jakarta',
        latitude: latitude || -6.2088,
        longitude: longitude || 106.8456,
        radius: radius || 100
      };

      res.json({
        success: true,
        message: 'Location updated successfully',
        data: location
      });
    } catch (error) {
      console.error('Update location error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update location'
      });
    }
  }

  // Delete location
  async delete(req, res) {
    try {
      const { id } = req.params;

      // TODO: Implement with Location model

      res.json({
        success: true,
        message: 'Location deleted successfully'
      });
    } catch (error) {
      console.error('Delete location error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete location'
      });
    }
  }
}

export default new LocationController();
