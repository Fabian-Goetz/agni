import { SupabaseClient } from '@supabase/supabase-js';
import { ContentStore } from './content-store.port';
import { VehicleType } from '../models/vehicle-type';
import { Equipment } from '../models/equipment';
import { Vehicle, Placement } from '../models/vehicle';

/**
 * Supabase-backed ContentStore (ADR-0002). Same port as the local adapter, so it
 * swaps in with zero domain changes. Takes the shared client (supabase.client.ts)
 * so the signed-in JWT rides along; Row-Level Security (docs/supabase/schema.sql)
 * scopes every read/write to the owner — `owner_id` defaults to `auth.uid()` on
 * insert, so writes never set it explicitly. Vehicle types are shared reference
 * data seeded via SQL, hence read-only here.
 */
export class SupabaseContentStore implements ContentStore {
  constructor(private readonly db: SupabaseClient) {}

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

  async loadEquipment(): Promise<Equipment[]> {
    const { data, error } = await this.db.from('equipment').select('*');
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category ?? undefined,
      subcategory: r.subcategory ?? undefined,
      synonyms: r.synonyms ?? undefined,
      kurzzeichen: r.kurzzeichen ?? undefined,
      beschreibung: r.beschreibung ?? undefined,
      verwendung: r.verwendung ?? undefined,
      dinRef: r.din_ref ?? undefined,
      istBehaelter: r.ist_behaelter ?? undefined,
      typischerContainer: r.typischer_container ?? undefined,
    }));
  }
  async addEquipment(equipment: Equipment): Promise<void> {
    const { error } = await this.db.from('equipment').upsert({
      id: equipment.id,
      name: equipment.name,
      category: equipment.category ?? null,
      subcategory: equipment.subcategory ?? null,
      synonyms: equipment.synonyms ?? null,
      kurzzeichen: equipment.kurzzeichen ?? null,
      beschreibung: equipment.beschreibung ?? null,
      verwendung: equipment.verwendung ?? null,
      din_ref: equipment.dinRef ?? null,
      ist_behaelter: equipment.istBehaelter ?? null,
      typischer_container: equipment.typischerContainer ?? null,
    });
    if (error) throw error;
  }

  async loadVehicles(): Promise<Vehicle[]> {
    const { data, error } = await this.db.from('vehicles').select('*');
    if (error) throw error;
    return (data ?? []).map((r) => ({ id: r.id, name: r.name, typeId: r.type_id }));
  }
  async putVehicle(vehicle: Vehicle): Promise<void> {
    const { error } = await this.db
      .from('vehicles')
      .upsert({ id: vehicle.id, name: vehicle.name, type_id: vehicle.typeId });
    if (error) throw error;
  }
  async deleteVehicle(vehicleId: string): Promise<void> {
    // placements cascade on the FK (schema.sql); RLS scopes the delete to the owner.
    const { error } = await this.db.from('vehicles').delete().eq('id', vehicleId);
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
  async addPlacements(placements: Placement[]): Promise<void> {
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
  async removePlacement(placement: Placement): Promise<void> {
    const { error } = await this.db
      .from('placements')
      .delete()
      .match({
        vehicle_id: placement.vehicleId,
        compartment_id: placement.compartmentId,
        equipment_id: placement.equipmentId,
      });
    if (error) throw error;
  }
}
