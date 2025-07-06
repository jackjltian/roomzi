import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function updateChatNames() {
  try {
    console.log('🔄 Starting chat names update...');

    // Get all chats
    const chats = await prisma.chats.findMany({
      include: {
        tenant_profile: {
          select: { full_name: true }
        },
        landlord_profile: {
          select: { full_name: true }
        },
        listing: {
          select: { title: true }
        }
      }
    });

    console.log(`📊 Found ${chats.length} chats to process`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const chat of chats) {
      try {
        const tenantName = chat.tenant_profile?.full_name || null;
        const landlordName = chat.landlord_profile?.full_name || null;
        const propertyName = chat.listing?.title || null;

        // Check if any names need updating
        const needsUpdate = 
          chat.tenant_name !== tenantName ||
          chat.landlord_name !== landlordName ||
          chat.property_name !== propertyName;

        if (needsUpdate) {
          await prisma.chats.update({
            where: { id: chat.id },
            data: {
              tenant_name: tenantName,
              landlord_name: landlordName,
              property_name: propertyName,
            },
          });
          updatedCount++;
          console.log(`✅ Updated chat ${chat.id}:`, {
            tenant: tenantName || 'null',
            landlord: landlordName || 'null',
            property: propertyName || 'null'
          });
        } else {
          skippedCount++;
          console.log(`⏭️  Skipped chat ${chat.id} - already up to date`);
        }
      } catch (error) {
        console.error(`❌ Error updating chat ${chat.id}:`, error.message);
      }
    }

    console.log('\n📈 Update Summary:');
    console.log(`✅ Updated: ${updatedCount} chats`);
    console.log(`⏭️  Skipped: ${skippedCount} chats`);
    console.log(`📊 Total processed: ${chats.length} chats`);

  } catch (error) {
    console.error('❌ Error during update:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateChatNames()
  .then(() => {
    console.log('🎉 Chat names update completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Update failed:', error);
    process.exit(1);
  }); 