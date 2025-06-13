import { supabase } from "../config/supabase.js";

export default {
    async createListing(req, res) {
        try {
            console.log("incoming data", req.body);
            const {
                title,
                type,
                address,
                city,
                state,
                zipCode,
                bedrooms,
                bathrooms,
                area,
                price,
                description,
                leaseType,
                amenities,
                requirements,
                houseRules
            } = req.body;

            const { data, error } = await supabase
                .from('listings')
                .insert([{
                    title,
                    type,
                    address,
                    city,
                    state,
                    zip_code: zipCode,
                    bedrooms,
                    bathrooms,
                    area,
                    price,
                    description,
                    lease_type: leaseType,
                    amenities,
                    requirements,
                    house_rules: houseRules
                }])
                .select();

            if (error) {
                console.error(error);
                return res.status(500).json({ 
                    error: 'An error occurred while creating the listing.'
                });
            }

            res.status(201).json({ 
                message: 'The listing has been created.', 
                listing: data[0] 
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({
                error: 'An error occurred while creating the listing.'
            });
        }
    },

    async getListings(req, res) {
        try {
            const { data, error } = await supabase
                .from('listings')
                .select('*');
            
            if (error) {
                console.error(error);
                return res.status(500).json({ 
                    error: 'An error occurred while getting the listings.'
                });
            }

            res.status(200).json(data);
        } catch (err) {
            console.error(err);
            res.status(500).json({
                error: 'An error occurred while getting the listings.'
            });
        }
    }
}