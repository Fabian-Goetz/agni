import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ContentStore } from './content-store.port';
import { VehicleType } from '../models/vehicle-type';
import { Equipment } from '../models/equipment';
import { Vehicle, Placement } from '../models/vehicle';

/**
 * Supabase-backed ContentStore (ADR-0002). Same port as the local adapter, so
 * it swaps in with zero domain changes. Row-Level Security (docs/supabase/schema.sql)
 * scopes every read/write to the signed-in owner.
 *
 * NOTE (scaffold): save* uses upsert for equipment/vehicles (removed rows are
 * not pruned) and full delete-then-insert for placements. A production version
 * would extend the port with granular delete/add ops instead of whole-array
 * saves. vehicle_types are shared reference data seeded via SQL; save is a no-op.
 */
export class SupabaseContentStore implements ContentStore {
  private readonly db: SupabaseClient;

  constructor(url: string, anonKey: string) {
    this.db = createClient(url, anonKey);
  }

  async loadVehicleTypes(): Promise<VehicleType[]> {
    const { data, error } = await this.db.from('vehicle_types').select('*');
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      compartments: r.compartments,
      defaultLoadout: r.default_loadout,
      hasCustomSketch: r.has_custom_sketch,
    }));
  }

  async saveVehicleTypes(): Promise<void> {
    // Shared reference data — managed via SQL, not writable through the anon key.
  }

  async loadEquipment(): Promise<Equipment[]> {
    const { data, error } = await this.db.from('equipment').select('*');
    if (error) throw error;
    return (data ?? []).map((r) => ({ id: r.id, name: r.name, category: r.category ?? undefined }));
  }

  async saveEquipment(equipment: Equipment[]): Promise<void> {
    if (equipment.length === 0) return;
    const { error } = await this.db
      .from('equipment')
      .upsert(equipment.map((e) => ({ id: e.id, name: e.name, category: e.category ?? null })));
    if (error) throw error;
  }

  async loadVehicles(): Promise<Vehicle[]> {
    const { data, error } = await this.db.from('vehicles').select('*');
    if (error) throw error;
    return (data ?? []).map((r) => ({ id: r.id, name: r.name, typeId: r.type_id }));
  }

  async saveVehicles(vehicles: Vehicle[]): Promise<void> {
    if (vehicles.length === 0) return;
    const { error } = await this.db
      .from('vehicles')
      .upsert(vehicles.map((v) => ({ id: v.id, name: v.name, type_id: v.typeId })));
    if (error) throw error;
  }

  async loadPlacements(): Promise<Placement[]> {
    const { data, error } = await this.db.from('placements').select('*');
    if (error) throw error;
    return (data ?? []).map((r) => ({
      vehicleId: r.vehicle_id,
      compartmentId: r.compartment_id,
      equipmentId: r.equipment_id,
      qty: r.qty ?? undefined,
    }));
  }

  async savePlacements(placements: Placement[]): Promise<void> {
    // Full replace of the owner's placements (they have no app-stable id).
    const del = await this.db.from('placements').delete().not('id', 'is', null);
    if (del.error) throw del.error;
    if (placements.length === 0) return;
    const { error } = await this.db.from('placements').insert(
      placements.map((p) => ({
        vehicle_id: p.vehicleId,
        compartment_id: p.compartmentId,
        equipment_id: p.equipmentId,
        qty: p.qty ?? null,
      })),
    );
    if (error) throw error;
  }
}
